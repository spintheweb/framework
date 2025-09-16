// SPDX-License-Identifier: MIT
// Spin the Web module: stwSpinner.ts

import { getCookies } from "@std/http/cookie";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { STWSession } from "./stwComponents/stwSession.ts";
import { STWSite } from "./stwElements/stwSite.ts";
import { handleHttp } from "./stwComponents/stwHttpHandler.ts";
import { handleWebSocket } from "./stwComponents/stwWebSocket.ts";
import project from "./deno.json" with { type: "json" };

// Load environment variables based on context
const envPath = Deno.env.get("SPINNER_ENV") === "docker" ? ".env.docker" : ".env";
const env = await config({ path: envPath });

// If a PORTAL_URL is provided (env or .env), fetch it and persist to SITE_WEBBASE path before the site loads.
try {
    const portalUrl = Deno.env.get("PORTAL_URL") || env["PORTAL_URL"];
    if (portalUrl && /^https?:\/\//i.test(portalUrl)) {
        const webbasePath = Deno.env.get("SITE_WEBBASE") || env["SITE_WEBBASE"] || "./public/.data/webapplication.wbdl";
        console.log(`${new Date().toISOString()}: Fetching portal webbase from ${portalUrl} ...`);
        const res = await fetch(portalUrl);
        if (!res.ok) throw new Error(`Failed to download portal webbase: ${res.status} ${res.statusText}`);
        const json = await res.text(); // keep as text; it's stored and later parsed by STWSite
    // Ensure folder exists
    const dir = webbasePath.replace(/\\/g, "/").split("/").slice(0, -1).join("/") || ".";
    await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(webbasePath, json);
        console.log(`${new Date().toISOString()}: Portal webbase saved to ${webbasePath}.`);
        // Ensure STWSite reads the same path
        try { Deno.env.set("SITE_WEBBASE", webbasePath); } catch { /* readonly in some envs */ }
    }
} catch (error) {
    console.error(`PORTAL_URL setup error: ${(error as Error).message}`);
}

/**
 * Preload {@linkcode STWFactory} with the Spin the Web elements
 * 
 * @param path The directory containing the elements
 */
async function loadSTWElements(path: string) {
    for (const dirEntry of Deno.readDirSync(path))
        if (dirEntry.isFile && dirEntry.name.endsWith(".ts")) {
            const module = await import(`${path}/${dirEntry.name}`);
            const element = Object.keys(module).find(key => key.startsWith("STW") && key !== "STWLayout");
            if (element) new module[element]({});
        }
}
await loadSTWElements("./stwElements");
await loadSTWElements("./stwContents");

/**
 * Contains presently active sessions {@linkcode STWSession} 
 */
const stwSessions: Map<string, STWSession> = new Map();

/**
 * Spin the Web Spinner
 */
// Declare the variable that will hold the final options.
let serverOptions: Deno.ServeOptions;

// Determine the correct hostname based on the environment.
// In Docker, always listen on 0.0.0.0. Locally, use the .env setting.
const hostname: string = Deno.env.get("SPINNER_ENV") === "docker" ? "0.0.0.0" : (env["HOST"] || "127.0.0.1");

if (env["CERTFILE"] && env["KEYFILE"]) {
    serverOptions = {
        hostname: hostname,
        port: parseInt(env["PORT"] || "443"),
        cert: await Deno.readTextFile(env["CERTFILE"]),
        key: await Deno.readTextFile(env["KEYFILE"]),
        onListen: () => {
            console.log(`${new Date().toISOString()}: Spin the Web v${project.version} listening on https://${env["HOST"] || 'localhost'}:${env["PORT"] || '443'}`);
        }
    } as Deno.ServeOptions;
} else {
    serverOptions = {
        hostname: hostname,
        port: parseInt(env["PORT"] || "8000"),
        onListen: () => {
            console.log(`${new Date().toISOString()}: Spin the Web v${project.version} listening on http://${env["HOST"] || 'localhost'}:${env["PORT"] || '8000'}`);
        }
    } as Deno.ServeOptions;
}

Deno.serve(serverOptions, async (request: Request, info: Deno.ServeHandlerInfo): Promise<Response> => {
    let sessionId: string = getCookies(request.headers).sessionId;
    if (!sessionId)
        sessionId = crypto.randomUUID();

    let session = stwSessions.get(sessionId);

    if (
        !session ||
        (session.remoteAddr as Deno.NetAddr).hostname !== (info.remoteAddr as Deno.NetAddr).hostname
    ) {
        if (session)
            console.log(`${new Date().toISOString()}: IP address changed for session [${sessionId}]. A new session will be created.`);
        session = new STWSession(sessionId, info.remoteAddr, STWSite.instance);
        stwSessions.set(sessionId, session);
    }

    session.setPlaceholders(request);

    if (request.headers.get("upgrade") === "websocket") {
        return handleWebSocket(request, session, stwSessions);
    } else {
        return await handleHttp(request, session, sessionId);
    }
});
