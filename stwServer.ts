/**
 * Spin the Web server (Web Spinner) 
 * 
 * This file runs on a web server and is responsible for managing a Spin the Web 
 * site. 
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
 **/
import { serveFile } from "jsr:@std/http/file-server";
import { getCookies, setCookie } from "jsr:@std/http/cookie";
import { STWSession, STWElement, STWSite } from "./stwElements.ts"
import { } from "./stwContents.ts"

interface ISTWMessage {
	verb: string,
	pathname: string
}
interface ISTWSettings {
	hostname: string,
	port: number,
	multisessions: boolean;
	maxusers: number,
	timeout: number, // Session timeout in minutes
}
const Settings: ISTWSettings = JSON.parse(await Deno.readTextFile("./public/.data/stwSettings.json"));

const Site: STWSite = new STWSite(JSON.parse(await Deno.readTextFile("./public/.data/webbase.json")));
const Sessions: Map<string, STWSession> = new Map();

async function webspinner(request: Request): Promise<Response> {
	let sessionid: string = getCookies(request.headers).sessionid;
	if (!sessionid) {
		sessionid = crypto.randomUUID(); // Create new session
		Sessions.set(sessionid, { user: "guest", roles: ["guests"], lang: Site.lang, timestamp: Date.now(), site: Site });
	}
	const session: STWSession = Sessions.get(sessionid) || { user: "guest", roles: ["guests"], lang: Site.lang, timestamp: Date.now(), site: Site };

	if (Date.now() - session.timestamp > Settings.timeout * 60000) // Session timeout
		console.log('Refresh?');

	if (request.headers.get("upgrade") === "websocket") {
		const { socket, response } = Deno.upgradeWebSocket(request);

		socket.onmessage = event => {
			const data: ISTWMessage = JSON.parse(event.data);
			Site.find(session, data.pathname)?.render(request, session)
				.then(res => res.text())
				.then(text => socket.send(text));
		};
		socket.onerror = error => console.error("Error:", error);

		return response;
	}

	const pathname = new URL(request.url).pathname;

	if (request.method === "GET") {
		let response: Response = new Response(null, { status: 204 }); // 204 No content;

		const element: STWElement | undefined = Site.find(session, pathname);

		if (!element && pathname.indexOf("/.") === -1) // Do not serve paths that have files or directories that begin with a dot
			response = await serveFile(request, `./public${pathname}`);
		else if (element)
			if (element.type === "Content")
				response = await element.render(request, session, "");
			else if ("Site,Area,Page".indexOf(element.type) !== -1)
				response = await element.render(request);

		if (getCookies(request.headers).sessionid)
			return response;
		else {
			const headers = new Headers(response.headers);
			setCookie(headers, { name: "sessionid", value: sessionid, httpOnly: true, secure: true, sameSite: "Lax" });
			return new Response(response.body, { headers: headers });
		}
	}
	return new Response(null, { status: 204 }); // 204 No content
}

Deno.serve({ hostname: Settings.hostname, port: Settings.port }, webspinner);
