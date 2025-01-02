/**
 * Spin the Web Content element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession } from "../stwSession.ts";
import { STWLocalized, ISTWElement, STWElement } from "./stwElement.ts";
// import { STWDatasources } from "../stwDatasources.ts";

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
		// TODO: layout

		// const _records = STWDatasources.query(this);

		let debug: string = "";
		if (_session.debug) {
			debug = `data-debug="${this.type}: ${this.localize(_session, "name")} @${this.section}.${this.sequence}"`;
		}

		const data = {
			verb: "PUT",
			id: this._id,
			section: this.section,
			sequence: this.sequence,
			body: `
				<article id="${this._id}" data-sequence="${this.sequence}" class="${this.cssClass || "stw" + this.type}" ${debug}>
					<h1>${this.type} &mdash; ${this.localize(_session, "name")}</h1>
					<header>${this.cssClass} <a href="${this.permalink(_session)}">${this.permalink(_session)}</a></header>
					${_body}
					</footer>${this.section} ${this.sequence}</footer>
				</article>`,
		};

		console.debug(`${new Date().toISOString()}: ${this.type} (${this.permalink(_session)}) @${this.section}.${this.sequence} [${this._id}]`);

		return new Promise<Response>(resolve => resolve(new Response(JSON.stringify(data))));
	}
}
