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

export async function handleHttp(request: Request, session: STWSession, sessionId: string): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    const element = STWSite.instance.find(session, pathname);

    let response = new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content;

    if (request.method === "GET") {
        if (!element && pathname.indexOf("/.") === -1)
            response = serveFile(request, `./public${pathname}`);
        else if (element?.type === "Page" || element?.type === "Area" || element?.type === "Site")
            response = element.serve(request, session);
        else if (session.socket && element?.type) {
            const res = await element.serve(request, session);
            if (res.status === 200) {
                const text = await res.text();
                session.socket.send(text);
            }
        }

        if (!getCookies(request.headers).sessionId) {
            const headers = new Headers(request.headers);
            setCookie(headers, { name: "sessionId", value: sessionId, httpOnly: true, secure: true, sameSite: "Lax" });
            headers.set("contents", (await response).headers.get("contents") || "");
            return new Response((await response).body, { headers: headers });
        }

    } else if (request.method == "POST") {
        const maxupload = parseInt(Deno.env.get("MAX_UPLOADSIZE") || "200") * 1024;

        const data: Record<string, any> = {};
        for (const [key, value] of (await request.formData()).entries())
            data[key] = value instanceof File ? { name: value.name, type: value.type, size: value.size, content: value.size < maxupload ? await value.text() : null } : value;

        if (STWSite.index.get(data.stwOrigin)?.isVisible(session, false)) {
            session.socket?.send(JSON.stringify({ method: "PUT", section: "dialog", body: `<label>Form data ${data.stwAction}</label><pre>${JSON.stringify(data, null, 4)}</pre>` }));
        }
    }
    return response;
}