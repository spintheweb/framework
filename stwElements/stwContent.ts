/**
 * Spin the Web Content element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { lexer } from "../stwContents/WBLL.ts";
import { ISTWRecords, STWDatasources } from "../stwDatasources.ts";
import { STWSession } from "../stwSession.ts";
import { STWLocalized, ISTWElement, STWElement } from "./stwElement.ts";

export interface ISTWOption {
	name: STWLocalized;
	path?: string;
	target?: string;
}

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
	protected _layout!: Map<string, object>; // TODO: compiled version of layout

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

	// deno-lint-ignore no-explicit-any
	async serve(req: Request, session: STWSession, _shortcut: any): Promise<Response> {
		if (!_shortcut && !this.isVisible(session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		console.debug(`${new Date().toISOString()}: ${_shortcut ? "│└" : "├─"} ${this.type} (${this.pathname(session)}) @${this.section}.${this.sequence} [${this._id}]`);

		let debug: string = "";
		if (session.debug && !this.pathname(session).startsWith("/stws/")) {
			debug = `<a class="stwInfo" href="/stws/content?_id=${(_shortcut || this)._id}" title="${(_shortcut || this).type}: ${(_shortcut || this).localize(session, "name")} §${(_shortcut || this).section}:${(_shortcut || this).sequence}">Edit</a>`;
		}

		let layout;
		try {
			layout = lexer(req, this.localize(session, "layout"));
		// deno-lint-ignore no-explicit-any
		} catch (error: any) {
			return new Promise<Response>(resolve => resolve(new Response(JSON.stringify({
				method: "PUT",
				id: this._id,
				section: "stwProblems",
				body: `<date>${Date.now()}</date><samp>${error.message}</samp>`,
			}))));
		}

		const data = {
			method: "PUT",
			id: this._id,
			section: (_shortcut || this).section,
			sequence: (_shortcut || this).sequence,
			body: `<article id="${this._id}" data-sequence="${this.sequence}" class="${(_shortcut || this).cssClass || "stw" + this.type}">
				${debug}
				${layout.settings.caption ? `<h1>${layout.settings.caption}</h1>` : ""}
				${layout.settings.header ? `<header>${layout.settings.header}</header>` : ""}
				${this.render(req, session, await STWDatasources.query(session, this))}
				${layout.settings.footer ? `<footer>${layout.settings.footer}</footer>` : ""}
			</article>`,
		};
		return new Promise<Response>(resolve => resolve(new Response(JSON.stringify(data))));
	}

	render(_req: Request, _session: STWSession, _record: ISTWRecords): string {
		return `Render ${this.constructor.name}`;
	}
}
