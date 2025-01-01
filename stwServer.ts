/**
 * Spin the Web server (Web Spinner) 
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

// Load Spin the Web elements
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

const Sessions: Map<string, STWSession> = new Map();

Deno.serve(
	{
		hostname: Deno.env.get("HOSTNAME") || "127.0.0.1",
		port: parseInt(Deno.env.get("PORT") || "80"),
	},
	async (request: Request): Promise<Response> => {
		let sessionId: string = getCookies(request.headers).sessionId;
		if (!sessionId) {
			sessionId = crypto.randomUUID(); // Create new session
			Sessions.set(sessionId, new STWSession(sessionId));
		}
		const session: STWSession = Sessions.get(sessionId) || new STWSession(sessionId);

		if (request.headers.get("upgrade") === "websocket") {
			const { socket, response } = Deno.upgradeWebSocket(request);

			socket.onmessage = event => {
				const data: { verb: string, resource: string } = JSON.parse(event.data);
				data.resource.split(",").forEach(async resource => {
					const response = await STWSite.get().find(session, resource)?.serve(request, session, "");
					if (response)
						socket.send(await response.text());
				});
			};
			socket.onerror = error => console.error("Error:", error);

			return new Promise<Response>(resolve => resolve(response));;
		}

		const pathname = new URL(request.url).pathname;

		if (request.method === "GET") {
			let response: Promise<Response>;
			const element = STWSite.get().find(session, pathname);

			if (!element && pathname.indexOf("/.") === -1)  // Do not serve paths that have files or directories that begin with a dot
				response = serveFile(request, `./public${pathname}`);
			else if (element?.type === "Content") // Serve content
				response = element.serve(request, session, ""); // Serve page, area or site, for areas and sites handle their mainpage
			else if (element?.type === "Page" || element?.type === "Area" || element?.type === "Site")
				response = element.serve(request, session, "");
			else
				response = new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

			if (getCookies(request.headers).sessionId)
				return response;
			else {
				const headers = new Headers(request.headers);
				setCookie(headers, { name: "sessionId", value: sessionId, httpOnly: true, secure: true, sameSite: "Lax" });
				return new Response((await response).body, { headers: headers });
			}
		}

		return new Promise<Response>(resolve => {
			const response = new Response(null, { status: 204 }); // 204 No content
			resolve(response);
		});
	}
);


