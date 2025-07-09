/**
 * Spin the Web Http handler
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2025 Giancarlo Trevisan
**/
import { serveFile } from "@std/http/file-server";
import { getCookies, setCookie } from "@std/http/cookie";
import { STWSite } from "../stwElements/stwSite.ts";
import { STWSession } from "./stwSession.ts";
import { STWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "./stwDatasources.ts";

export async function handleHttp(request: Request, session: STWSession, sessionId: string): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const element = STWSite.instance.find(session, pathname);

    let response: Response = new Response(null, { status: 204 }); // Default: 204 No content

    if (request.method === "GET") {
        if (!element && !pathname.includes("/."))
            response = await serveFile(request, `./public${pathname}`);
        else if (element?.type === "Page" || element?.type === "Area" || element?.type === "Site")
            response = await element.serve(request, session);
        else if (session.socket && element?.type) {
            const res = await element.serve(request, session);
            if (res.status === 200) {
                const text = await res.text();
                session.socket.send(text);
            }
        }

        // Set session cookie if not present
        if (!getCookies(request.headers).sessionId) {
            const headers = new Headers(request.headers);
            setCookie(headers, { name: "sessionId", value: sessionId, httpOnly: true, secure: true, sameSite: "Lax" });
            headers.set("contents", response.headers.get("contents") || "");
            return new Response(response.body, { headers });
        }
        return response;

    } else if (request.method === "POST") {
        try {
            const maxupload = parseInt(Deno.env.get("MAX_UPLOADSIZE") || "200") * 1024;
            const formData = await request.formData();

            // Collect all values for each key
            const fieldMap: Record<string, any[]> = {};
            for (const [key, value] of formData.entries()) {
                if (!fieldMap[key]) fieldMap[key] = [];
                if (value instanceof File) {
                    fieldMap[key].push({
                        name: value.name,
                        type: value.type,
                        size: value.size,
                        content: value.size < maxupload ? await value.text() : null
                    });
                } else {
                    fieldMap[key].push(value);
                }
            }

            // Determine the number of rows (max array length)
            const numRows = Math.max(...Object.values(fieldMap).map(arr => arr.length), 1);

            // Build rows
            const rows: Record<string, any>[] = [];
            for (let i = 0; i < numRows; i++) {
                const row: Record<string, any> = {};
                for (const key in fieldMap) {
                    row[key] = fieldMap[key].length === 1 ? fieldMap[key][0] : (fieldMap[key][i] ?? fieldMap[key][fieldMap[key].length - 1]);
                }
                rows.push(row);
            }

            // Remove the first row if present
            if (rows.length > 1) rows.shift();

            const fields = Object.keys(fieldMap).map(name => ({ name }));
            const records: ISTWRecords = {
                fields,
                rows,
                affectedRows: rows.length
            };

            const origin = STWSite.index.get(rows[0]?.stwOrigin), action = rows[0]?.stwAction || "submit";

            if (origin instanceof STWContent && origin?.isVisible(session, false)) {
                try {
                    const result = origin.getLayout(session).handleAction(action, records);
                    session.socket?.send(JSON.stringify({
                        method: "PUT",
                        section: "dialog",
                        body: `<label>Form data ${action}</label><pre>${JSON.stringify(records, null, 4)}</pre>`
                    }));
                } catch (err) {
                    session.socket?.send(JSON.stringify({
                        method: "PUT",
                        section: "dialog",
                        body: `<label>Error</label><pre>${err.message}</pre>`
                    }));
                }
            }
            // Always return a response
            return new Response(null, { status: 204 });
        } catch (err) {
            return new Response("Error processing form data", { status: 400 });
        }
    }

    return response;
}