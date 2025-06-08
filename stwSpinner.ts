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
import { getCookies } from "jsr:@std/http/cookie";
import { STWSession } from "./stwSession.ts";
import { STWSite } from "./stwElements/stwSite.ts";
import { handleHttp } from "./stwHttpHandler.ts";
import { handleWebSocket } from "./stwWebSocket.ts";

/**
 * Preload {@linkcode STWFactory} with the Spin the Web elements
 * 
 * @param path The directory containing the elements
 */
async function loadSTWElements(path: string) {
	for (const dirEntry of Deno.readDirSync(path))
		if (dirEntry.isFile) {
			const module = await import(`${path}/${dirEntry.name}`);
			const element = Object.keys(module).find(key => key.startsWith("STW") && key !== "STWLayout");
			if (element) new module[element]({});
		}
}
await loadSTWElements("./stwElements");
await loadSTWElements("./stwContents");
STWSite.watchWebbase(); // Start watching for changes

/**
 * Contains presently active sessions {@linkcode STWSession} 
 */
const stwSessions: Map<string, STWSession> = new Map();

/**
 * Spin the Web Spinner
 */
Deno.serve(
	{
		hostname: Deno.env.get("HOST") || "127.0.0.1",
		port: parseInt(Deno.env.get("PORT") || "80"),
		// cert: await Deno.readTextFile(Deno.env.get("CERTFILE") || ""),
		// key: await Deno.readTextFile(Deno.env.get("KEYFILE") || "")
	},
	async (request: Request, info: Deno.ServeHandlerInfo): Promise<Response> => {
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
	}
);
