/**
 * Spin the Web Content element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { ISTWRecords, STWDatasources } from "../stwDatasources.ts";
import { STWSession } from "../stwSession.ts";
import { STWLocalized, ISTWElement, STWElement } from "./stwElement.ts";
import { STWLayout } from "../stwContents/wbll.ts";

/**
 * The contents that use this interface are: {@linkcode STWMenu}, {@linkcode STWMenus}, {@linkcode STWTabs} and {@linkcode STWImagemap}
 */
export interface ISTWOption {
	name: STWLocalized;
	path?: string;
	target?: string;
	options?: ISTWOption[];
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
	protected layout!: Map<string, STWLayout>;

	constructor(content: ISTWContent) {
		super(content);

		this.type = content.subtype;
		this.cssClass = content.cssClass;
		this.section = content.section;
		this.sequence = content.sequence || 0.0;
		this.dsn = content.dsn;
		this.query = content.query;
		this.parameters = content.parameters;

		if (["Text", "Script", "Shortcut"].includes(this.type) == false && content.layout) {
			this.layout = new Map();
			for (const [lang, wbll] of Object.entries(content.layout)) {
				try {
					this.layout.set(lang, new STWLayout(this.type, wbll));
				} catch (error) {
					throw SyntaxError(`${this.type} (${this.name.entries().next().value}) @${this.section}.${this.sequence} [${this._id}]\n └ Layout: ${(error as Error).message}`);
				}
			}
		}
	}

	getLayout(session: STWSession): STWLayout {
		return this.layout.get(session.lang) || new STWLayout(this.type, "");
	}

	override localize(session: STWSession, name: "name" | "slug" | "keywords" | "description", value: string = ""): string {
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

		const layout = this.layout?.get(session.lang);

		const data = {
			method: "PUT",
			id: this._id,
			section: (_shortcut || this).section,
			sequence: (_shortcut || this).sequence,
			body: `<article id="${this._id}" data-sequence="${this.sequence}" class="${(_shortcut || this).cssClass || "stw" + this.type}">
				${debug}
				${layout?.settings.get("caption") ? `<h1>${layout?.settings.get("caption")}</h1>` : ""}
				${layout?.settings.get("header") ? `<header>${layout?.settings.get("header")}</header>` : ""}
				${this.render(req, session, await STWDatasources.query(session, this))}
				${layout?.settings.get("footer") ? `<footer>${layout?.settings.get("footer")}</footer>` : ""}
			</article>`,
		};
		return new Promise<Response>(resolve => resolve(new Response(JSON.stringify(data))));
	}

	render(_req: Request, _session: STWSession, _record: ISTWRecords): string {
		return `Render ${this.constructor.name}`;
	}
}
