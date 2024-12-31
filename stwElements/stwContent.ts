/**
 * Spin the Web Content element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession } from "../stwSession.ts";
import { STWLocalized, ISTWElement, STWElement } from "./stwElement.ts";

export interface ISTWContent extends ISTWElement {
	subtype: string;
	cssClass: string;
	section: string;
	sequence: number;
	dsn: string;
	query: string;
	parameters: string;
	layout: object;
}
export abstract class STWContent extends STWElement {
	cssClass: string;
	section: string;
	sequence: number;
	dsn: string;
	query: string;
	parameters: string;
	layout: STWLocalized;

	constructor(content: ISTWContent) {
		super(content);

		this.type = content.subtype;
		this.cssClass = content.cssClass;
		this.section = content.section;
		this.sequence = content.sequence || 0.0;
		this.dsn = content.dsn;
		this.query = content.query;
		this.parameters = content.parameters;
		this.layout = new Map(Object.entries(content.layout || {}));
	}

	override render(_req: Request, _session: STWSession, _body: string = ""): Response {
		// TODO: layout

		// TODO: Show popup with content info
		let debug: string = "";
		if (_session.debug)
			debug = `data-debug="${this.type}: ${this.localize(_session, "name")} @${this.section}.${this.sequence}"`;

		const data = {
			verb: "PUT",
			id: this._id,
			section: this.section,
			sequence: this.sequence,
			body: `
				<article id="${this._id}" class="${this.cssClass || "stw" + this.type}" ${debug}>
					<h1>Caption</h1>
					<header>Header</header>
					${_body}
					</footer>Footer</footer>
				</article>`,
		};
		return new Response(JSON.stringify(data), { status: 200 });
	}
}
