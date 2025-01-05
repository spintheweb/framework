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

	override localize(session: STWSession, name: "name" | "slug" | "keywords" | "description" | "layout", value: string = ""): string {
		if (value) {
			value = name === "slug" ? value.replace(/[^a-z0-9_]/gi, "").toLowerCase() : value;
			this[name].set(session.lang, value);
			return value;
		}
		return this[name].get(session.lang) || "";
	}

	override serve(_req: Request, _session: STWSession, _body: string = ""): Promise<Response> {
		console.info(`${new Date().toISOString()}: ${this.type} (${this.permalink(_session)}) @${this.section}.${this.sequence} [${this._id}]`);

		let debug: string = "";
		if (_session.debug) {
			debug = `<a href="/stws/content?_id=${this._id}" style="float:right" title="${this.type}: ${this.localize(_session, "name")} §${this.section} @${this.sequence}"><i class="fas fa-sliders-h"></i></a>`;
		}

		const data = {
			method: "PUT",
			id: this._id,
			section: this.section,
			sequence: this.sequence,
			body: `
				<article id="${this._id}" data-sequence="${this.sequence}" class="${this.cssClass || "stw" + this.type}">
					<h1>${this.type} &mdash; ${this.localize(_session, "name")}${debug}</h1>
					<header>${this.cssClass}</header>
					${_body}
					</footer>${this.section} ${this.sequence} ${_req.url}</footer>
				</article>`,
		};
		return new Promise<Response>(resolve => resolve(new Response(JSON.stringify(data))));
	}
}
