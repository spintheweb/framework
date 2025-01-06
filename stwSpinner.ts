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
import { STWContent } from "./stwElements/stwContent.ts";

/**
 * Preload {@linkcode STWFactory} with the Spin the Web elements
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
		port: parseInt(Deno.env.get("PORT") || "80"),
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

					request = new Request(new URL(request.url).origin + data.resource); // URL
					data.resource = (STWSite.get().find(session, data.resource) as STWPage)?.contents(session) || [];
				}
				/**
				 * Sockets requests contents which may generate output (HTML), execute (API) or do both
				 */
				let process = data.resource.length;
				data.resource?.forEach(async (resource: string, i: number) => {
					const content = STWSite.get().find(session, resource);

					if (content instanceof STWContent) {
						const response = await content?.serve(request, session);
						if (response.status == 200)
							data.resource[i] = await (await content?.serve(request, session)).json();
						else
							data.resource[i] = { method: "DELETE", id: content._id };
						if (!--process)
							send();
					}
				});

				function send(): void {
					// deno-lint-ignore no-explicit-any
					data.resource?.sort((a: any, b: any) => {
						if (a.section == b.section)
							return Math.trunc(a.sequence) != Math.trunc(b.sequence) ? 0 : a.sequence < b.sequence ? -1 : 1;
						return 0;
					});
					// deno-lint-ignore no-explicit-any
					data.resource?.forEach((content: any) => Socket.send(JSON.stringify(content)));
				}
			};
			Socket.onerror = error => console.error(error);

			return new Promise<Response>(resolve => resolve(response));;
		}

		const pathname = new URL(request.url).pathname;
		const element = STWSite.get().find(session, pathname);

		let response = new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content;

		if (request.method === "GET") {
			if (!element && pathname.indexOf("/.") === -1)  // Do not serve paths that have files or directories that begin with a dot
				response = serveFile(request, `./public${pathname}`);
			else if (element?.type === "Page" || element?.type === "Area" || element?.type === "Site")
				response = element.serve(request, session); // Serve page, area or site, for areas and sites handle their mainpage
			else if (Socket && element?.type) {
				const res = await element.serve(request, session);
				if (res.status === 200) {
					const text = await res.text();
					Socket.send(text);
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

			// TODO: Handle data: stworigin and stwaction
			Socket.send(JSON.stringify({ method: "PUT", section: "modaldialog", body: `<label>Form data</label><pre>${JSON.stringify(data, null, 4)}</pre>` }));
		}

		return response;
	}
);


