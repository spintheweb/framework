/**
 * Spin the Web server (Web Spinner) 
 * 
 * This code runs on a web server and is responsible for interpreting a Spin the Web 
 * site. 
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
			new module[Object.keys(module).find(key => key.startsWith("STW")) || "STWSite"]({});
		}
}
await loadSTWElements("./stwElements");
await loadSTWElements("./stwContents");

interface ISTWMessage {
	verb: string,
	resource: string
}
interface ISTWSettings {
	hostname: string,
	port: number,
	multisessions: boolean;
	maxusers: number,
	timeout: number, // Session timeout in minutes
}
const Settings: ISTWSettings = JSON.parse(Deno.readTextFileSync("./public/.data/stwSettings.json"));

STWSite.load(JSON.parse(Deno.readTextFileSync("./public/.data/webbase.json")));

const Sessions: Map<string, STWSession> = new Map();

function webspinner(request: Request) {
	let sessionid: string = getCookies(request.headers).sessionid;
	if (!sessionid) {
		sessionid = crypto.randomUUID(); // Create new session
		Sessions.set(sessionid, new STWSession);
	}
	const session: STWSession = Sessions.get(sessionid) || new STWSession;

	if (Date.now() - session.timestamp > Settings.timeout * 60000) // Session timeout
		console.log('Refresh?');

	if (request.headers.get("upgrade") === "websocket") {
		const { socket, response } = Deno.upgradeWebSocket(request);

		socket.onmessage = event => {
			const data: ISTWMessage = JSON.parse(event.data);
			data.resource.split(",").forEach(async resource => {
				const text = await STWSite.load().find(session, resource)?.render(request, session, "").text();
				if (text)
					socket.send(text);
			});
		};
		socket.onerror = error => console.error("Error:", error);

		return response;
	}

	const pathname = new URL(request.url).pathname;

	if (request.method === "GET") {
		let response: Response = new Response(null, { status: 204 }); // 204 No content;

		const element = STWSite.load().find(session, pathname);

		if (!element && pathname.indexOf("/.") === -1) { // Do not serve paths that have files or directories that begin with a dot
			return serveFile(request, `./public${pathname}`);

		} else if (element)
			if (element.type === "Content")
				response = element.render(request, session, "");
			else if ("Site,Area,Page".indexOf(element.type) !== -1)
				response = element.render(request, null, "");

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
