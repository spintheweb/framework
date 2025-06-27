/**
 * Spin the Web Content element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { ISTWRecords, STWDatasources } from "../stwComponents/stwDatasources.ts";
import { STWSession } from "../stwComponents/stwSession.ts";
import { STWLocalized, ISTWElement, STWElement } from "./stwElement.ts";
import { STWLayout } from "../stwContents/wbll.ts";

/**
 * The contents that use this interface are: {@linkcode STWMenus} and {@linkcode STWTabs}
 * 
 * @prop name: STWLocalized
 * @prop ref?: string
 * @prop target?: string
 * @prop options?: ISTWOption[]
 */
export interface ISTWOption {
	name: STWLocalized;
	ref?: string;
	target?: string;
	options?: ISTWOption[];
}
export interface ISTWContentWithOptions extends ISTWContent {
	options: ISTWOption[];
}

export interface ISTWContent extends ISTWElement {
    subtype: string;
    cssClass: string;
    section: string;
    sequence: number;
    dsn: string;
    query: string;
    params: string;
    layout: object;
    stateful?: boolean;
    cache?: number; // Cache duration in seconds. -1 for forever, 0 or undefined for no cache.
}
export abstract class STWContent extends STWElement {
    override readonly type: string;
    cssClass: string;
    section: string;
    sequence: number;
    dsn: string;
    query: string;
    params: string;
    protected layout!: Map<string, STWLayout>;
    readonly stateful: boolean;
    readonly cache: number;

	public constructor(content: ISTWContent, _settings?: { [key: string]: string }) {
		super(content);

        this.type = content.subtype;
        this.cssClass = content.cssClass;
        this.section = content.section;
        this.sequence = content.sequence || 0.0;
        this.dsn = content.dsn;
        this.query = content.query;
        this.params = content.params;
        this.stateful = content.stateful || false;
        this.cache = content.cache || 0;

		if (!["Text", "Script", "Shortcut"].includes(this.type) && content.layout) {
			this.layout = new Map();
			for (const [lang, wbll] of Object.entries(content.layout)) {
				try {
					this.layout.set(lang, new STWLayout(wbll));
				} catch (error) {
					throw SyntaxError(`${this.type} (${this.name.entries().next().value}) @${this.section}.${this.sequence} [${this._id}]\n └ Layout: ${(error as Error).message}`);
				}
			}
		} else if (content.layout)
			this.layout = new Map<string, STWLayout>(Object.entries(content.layout || {}));
	}

	public getLayout(session: STWSession): STWLayout {
		return this.layout.get(session.lang) || new STWLayout("");
	}

	public override localize(session: STWSession, name: "name" | "slug" | "keywords" | "description", value: string = ""): string {
		if (value) {
			value = name === "slug" ? value.replace(/[^a-z0-9_]/gi, "").toLowerCase() : value;
			this[name].set(session.lang, value);
			return value;
		}
		return this[name].get(session.lang) || "";
	}

	/**
	 * Retrieves the state of this content for the given session.
	 * The state is stored in the session object.
	 * @param session The current user session.
	 * @returns The state object, or undefined if not stateful or no state is set.
	 */
	public getState(session: STWSession): any {
		return this.stateful ? session.states?.get(this._id) : undefined;
	}

	/**
	 * Saves the state of this content for the given session.
	 * The state is stored in the session object.
	 * @param session The current user session.
	 * @param state The state object to save.
	 */
	public setState(session: STWSession, state: any): void {
		if (this.stateful) {
			if (!session.states) session.states = new Map<string, any>();
			session.states.set(this._id, state);
		}
	}

	public override async serve(req: Request, session: STWSession, ref: STWContent | undefined): Promise<Response> {
		if (!ref && !this.isVisible(session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		if (ref)
			console.debug(`${new Date().toISOString()}: ${ref._id === this._id ? " ●" : "│└"} ${this.type} (${this.pathname(session)}) @${this.section}.${this.sequence} [${this._id}]`);
		else
			console.debug(`${new Date().toISOString()}: ├─ ${this.type} (${this.pathname(session)}) @${this.section}.${this.sequence} [${this._id}]`);

		const layout = this.layout?.get(session.lang);

		let bodyHtml = "", records;
		try {
			records = await STWDatasources.query(session, this);

			bodyHtml = `<article tabindex="0" id="${this._id}" data-sequence="${this.sequence}" class="${(ref || this).cssClass || "stw" + this.type}">
				${layout?.settings.has("frame") ? `<fieldset><legend>${layout?.settings.get("frame")}</legend>` : ""}
				${!layout?.settings.has("frame") && layout?.settings.has("caption") ? `${collapsible()}${layout?.settings.get("caption")}</h1>` : ""}
				<div>
				${layout?.settings.has("header") ? `<header>${layout?.settings.get("header")}</header>` : ""}
				${await this.render(req, session, records)}
				${layout?.settings.has("footer") ? `<footer>${layout?.settings.get("footer")}</footer>` : ""}
				</div>
				${layout?.settings.has("frame") ? "</fieldset>" : ""}
			</article>`;

		} catch (error) {
			const safeStringify = (obj: any) => {
				const keys = [
					"subtype", "cssClass", "section", "sequence",
					"dsn", "query", "params", "layout"
				];
				const filtered: Record<string, unknown> = {};
				for (const key of keys)
					filtered[key] = obj[key];
				return JSON.stringify(filtered, null, 2);
			};
			bodyHtml = `<article tabindex="0" id="${this._id}" data-sequence="${this.sequence}" class="stwError">
				<h1><i class="fa-light fa-fw fa-bug"></i> Error</h1>
				<header>${(error as Error).message}</header>
				<pre>${safeStringify(this)}</pre>
			</article>`;
		}

		const data = {
			method: "PUT",
			id: this._id,
			section: (ref || this).section,
			sequence: (ref || this).sequence,
			body: bodyHtml,
		};
		if (layout?.settings.get("visible") === "false")
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content
		return new Promise<Response>(resolve => resolve(new Response(JSON.stringify(data))));

		function collapsible(): string {
			return layout?.settings.has("collapsible") ? `<h1 class="stwCollapsible" onclick="stwToggleCollapse(event)"><i class="fa-light fa-fw fa-angle-down"></i>` : "<h1>";
		}
	}

	public async render(_req: Request, _session: STWSession, _record: ISTWRecords): Promise<string> {
		return await Promise.resolve(`Render ${this.constructor.name}`);
	}
}
