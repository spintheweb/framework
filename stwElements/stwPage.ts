/**
 * Spin the Web Page element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { serveFile } from "jsr:@std/http/file-server";
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWElement, ISTWElement } from "./stwElement.ts";
import { STWContent } from "./stwContent.ts";

interface ISTWPage extends ISTWElement {
	template: string;
}
export class STWPage extends STWElement {
	template: string;

	public constructor(page: ISTWPage) {
		super(page);
		this.template = page.template || "/index.html";
	}

	public override toLocalizedJSON(session: STWSession): object {
		return {
			...super.toLocalizedJSON(session),
			template: this.template
		};
	}

	/**
	 * Given a page, determine all the visible contents: these are not only its children, but also 
	 * contents that are direct children of the parents areas up to the site. 
	 * 
	 * @param _session The current session
	 * @returns String array of contents ids
	 */
	public contents(_session: STWSession, recurse: boolean = true): string[] {
		const contents = this.children.filter(content => !(content as unknown as STWContent).section.startsWith("stwDialog") && content.isVisible(_session) & 1).map(content => content._id);
		if (recurse)
			climb(this.parent, contents, recurse);
		return contents;

		function climb(element: STWElement, contents: string[], recurse: boolean): void {
			if (element) {
				element.children.filter(content => (content as unknown as STWContent).section && content.isVisible(_session) & 1).map(content => contents.push(content._id));
				climb(element.parent, contents, recurse);
			}
		}
	}

	/**
	 * Resolve a {@linkcode Response} with the requested page
	 * 
	 * @param req The server request context
	 * @param session The current session
	 * @returns - A response for the request
	 */
	public override serve(req: Request, session: STWSession): Promise<Response> {
		console.debug(`${new Date().toISOString()}: ${this.type} (${this.pathname(session)}) [${this._id}]`);

		return serveFile(req, `./public/${this.template}`);
	}
}

STWFactory.Page = STWPage;