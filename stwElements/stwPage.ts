/**
 * Spin the Web Page element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { serveFile } from "jsr:@std/http/file-server";
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWElement, ISTWElement } from "./stwElement.ts";
import { STWContent } from "./stwContent.ts";

interface ISTWPage extends ISTWElement {
	template: string;
}
export class STWPage extends STWElement {
	template: string;

	constructor(page: ISTWPage) {
		super(page);
		this.template = page.template || "/index.html";
	}

	/**
	 * Resolve a {@linkcode Response} with the requested page
	 * 
	 * @param _req The server request context
	 * @param _session The current session
	 * @param _body ""
	 * @returns - A response for the request
	 */
	override async serve(_req: Request, _session: STWSession, _body: string = ""): Promise<Response> {
		const response = await serveFile(_req, `./public/${this.template}`);

		const headers = new Headers(response.headers);
		headers.set("contents", this.contents(_session));

		console.debug(`${new Date().toISOString()}: ${this.type} (${this.permalink(_session)}) [${this._id}]`);

		return new Promise<Response>(resolve => resolve(new Response(response.body, { status: response.status, headers: headers })));
	}

	/**
	 * Given a page, determine all the visible contents: these are not only its children, but also 
	 * contents that are direct children of the parents areas up to the site. 
	 * 
	 * @param _session The current session
	 * @returns Comma separated list of contents ids
	 */
	private contents(_session: STWSession): string {
		const contents = this.children.filter(content => (content as STWContent).section !== "dialog" /*&& content.isVisible(_session)*/).map(content => content._id);
		return contents.join(",");
	}
}

STWFactory.Page = STWPage;