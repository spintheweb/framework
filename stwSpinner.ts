/**
 * Spin the Web server, a.k.a., Web Spinner 
 * 
 * This code runs on a web server and is responsible for spinning a Spin the Web 
 * site, i.e., serving its webbase (WBML)
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
 **/
import { getCookies } from "https://deno.land/std/http/cookie.ts";
import { load } from "https://deno.land/std/dotenv/mod.ts";
import { STWSession } from "./stwComponents/stwSession.ts";
import { STWSite } from "./stwElements/stwSite.ts";
import { handleHttp } from "./stwComponents/stwHttpHandler.ts";
import { handleWebSocket } from "./stwComponents/stwWebSocket.ts";

const env = await load();

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
let serverOptions: Deno.ServeInit;

if (env["CERTFILE"] && env["KEYFILE"]) {
    // Assign a complete HTTPS options object.
    serverOptions = {
        hostname: env["HOST"] || "127.0.0.1",
        port: parseInt(env["PORT"] || "443"),
        cert: await Deno.readTextFile(env["CERTFILE"]),
        key: await Deno.readTextFile(env["KEYFILE"]),
        onListen: ({ hostname, port }) => {
            console.debug(`Spin the Web listening on https://${hostname || 'localhost'}:${port}`);
        }
    };
} else {
    // Assign a complete HTTP options object.
    serverOptions = {
        hostname: env["HOST"] || "127.0.0.1",
        port: parseInt(env["PORT"] || "8000"),
        onListen: ({ hostname, port }) => {
            console.debug(`Spin the Web listening on http://${hostname || 'localhost'}:${port}`);
        }
    };
}

Deno.serve(serverOptions, async (request: Request, info: Deno.ServeHandlerInfo): Promise<Response> => {
    let sessionId: string = getCookies(request.headers).sessionId;
    if (!sessionId)
        sessionId = crypto.randomUUID();

    if (JSON.stringify(stwSessions.get(sessionId)?.remoteAddr) !== JSON.stringify(info.remoteAddr))
        stwSessions.set(sessionId, new STWSession(sessionId, info.remoteAddr, STWSite.instance));
    const session = stwSessions.get(sessionId) || new STWSession(sessionId, info.remoteAddr, STWSite.instance);

    session.setPlaceholders(request);

    if (request.headers.get("upgrade") === "websocket") {
        return handleWebSocket(request, session);
    } else {
        return await handleHttp(request, session, sessionId);
    }
});
