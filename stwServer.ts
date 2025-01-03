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
import { serveFile } from "jsr:@std/http/file-server";
import { getCookies, setCookie } from "jsr:@std/http/cookie";
import { STWSession } from "./stwSession.ts";
import { STWSite } from "./stwElements/stwSite.ts";
import { STWPage } from "./stwElements/stwPage.ts";

/**
 * Preload {@linkcode STWFactory} with Spin the Web elements
 * 
 * @param path The directory containing the elements
 */
async function loadSTWElements(path: string) {
	for (const dirEntry of Deno.readDirSync(path))
		if (dirEntry.isFile) {
			const module = await import(`${path}/${dirEntry.name}`);
			const element = Object.keys(module).find(key => key.startsWith("STW"));
			if (element) new module[element]({});
		}
}
await loadSTWElements("./stwElements");
await loadSTWElements("./stwContents");

/**
 * Contains presently active sessions {@linkcode STWSession} 
 */
const Sessions: Map<string, STWSession> = new Map();

let Socket: WebSocket;

/**
 * Spin the Web Spinner
 */
Deno.serve(
	{
		hostname: Deno.env.get("HOSTNAME") || "127.0.0.1",
		port: parseInt(Deno.env.get("PORT") || "443"),
		// cert: await Deno.readTextFile(Deno.env.get("CERTFILE") || ""),
		// key: await Deno.readTextFile(Deno.env.get("KEYFILE") || "")
	},
	async (request: Request): Promise<Response> => {
		let sessionId: string = getCookies(request.headers).sessionId;
		if (!sessionId)
			sessionId = crypto.randomUUID();
		if (!Sessions.has(sessionId))
			Sessions.set(sessionId, new STWSession(sessionId)); // Create new session
		const session = Sessions.get(sessionId) || new STWSession(sessionId);

		if (request.headers.get("upgrade") === "websocket") {
			const { socket, response } = Deno.upgradeWebSocket(request);

			Socket = socket;

			Socket.onmessage = event => {
				// deno-lint-ignore no-explicit-any
				const data: { method: string, resource: any, options: any } = JSON.parse(event.data);

				if (data.method === "HEAD") {
					session.langs = data.options.langs || ["en"];
					session.lang = STWSite.get().langs.includes(data.options.lang) ? data.options.lang : session.langs.find(lang => STWSite.get().langs.includes(lang.substring(0, 2)))?.substring(0, 2) || "en";

					data.resource = (STWSite.get().find(session, data.resource) as STWPage)?.contents(session) || [];
				}
				data.resource?.forEach(async (resource: string) => {
					const response = await STWSite.get().find(session, resource)?.serve(request, session, "");
					if (response)
						Socket.send(await response.text());
				});
			};
			Socket.onerror = error => console.error(error);

			return new Promise<Response>(resolve => resolve(response));;
		}

		const pathname = new URL(request.url).pathname;
		const element = STWSite.get().find(session, pathname);

		if (request.method === "GET") {
			let response = new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content;

			if (!element && pathname.indexOf("/.") === -1)  // Do not serve paths that have files or directories that begin with a dot
				response = serveFile(request, `./public${pathname}`);
			else if (element?.type === "Page" || element?.type === "Area" || element?.type === "Site")
				response = element.serve(request, session, ""); // Serve page, area or site, for areas and sites handle their mainpage
			else if (Socket && element?.type) {
				const response = await element.serve(request, session, "");
				const text = await response.text();
				Socket.send(text);
			}

			if (getCookies(request.headers).sessionId)
				return response;
			else {
				const headers = new Headers(request.headers);
				setCookie(headers, { name: "sessionId", value: sessionId, httpOnly: true, secure: true, sameSite: "Lax" });
				headers.set("contents", (await response).headers.get("contents") || ""); // HEADER based approach
				return new Response((await response).body, { headers: headers });
			}
		}

		return new Promise<Response>(resolve => {
			const response = new Response(null, { status: 204 }); // 204 No content
			resolve(response);
		});
	}
);


