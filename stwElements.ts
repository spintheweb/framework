/**
 * Spin the Web elements @module stwElements
 * 
 * This module includes Spin the Web abstract base class STWElement along with the 
 * derived STWSite, STWArea, STWPage classes and abstract STWContent class. The STWContent
 * class is base class for all Spin the Web contents, see @module stwContents.ts
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { serveFile } from "jsr:@std/http/file-server";

type STWRole = string;
type STWLocalized = Map<string, string>;
type STWVisibility = Map<STWRole, boolean>;

// deno-lint-ignore no-explicit-any
export const STWFactory: { [key: string]: new (element: any) => any } = {};

export interface STWSession {
	user: string; // User name
	roles: string[]; // Roles played by the user. Note: Security revolves around this aspect!
	lang: string; // Preferred user language 
	timestamp: number; // Session timeout in minutes
	site: STWSite; // Spin the Web site associated to the session
}

export interface ISTWElement {
	_id: string;
	type: string;
	name: object;
	slug: object;
	_keys: object;
	_description: object;
	_visibility: object;
	children: ISTWElement[];
}
export abstract class STWElement {
	_id: string;
	type: string;
	name: STWLocalized;
	slug: STWLocalized;
	keys: STWLocalized;
	description: STWLocalized;
	visibility!: STWVisibility;
	parent!: STWElement;
	children: (STWElement | STWContent)[] = [];

	constructor(element: ISTWElement) {
		this._id = element._id ? element._id : crypto.randomUUID();
		this.type = element.type || this.constructor.name.replace("STW", "");
		this.name = new Map(Object.entries(element.name || { "en": `New ${this.type}` }));
		this.slug = new Map(Object.entries(element.slug || { "en": `New ${this.type}`.replace(/[^a-z0-9_]/gi, '').toLowerCase() }));
		this.keys = new Map(Object.entries(element._keys || {}));
		this.description = new Map(Object.entries(element._description || {}));
		this.visibility = new Map(Object.entries(element._visibility || {}));

		for (const child of element.children || []) {
			const constructor = STWFactory[child.subtype || child.type];
			if (constructor) {
				const element = new constructor(child);
				element.parent = this;
				this.children.push(element);

				STWSite.index.set(element._id, element);
			}
		}
	}

	localize(session: STWSession, name: "name" | "slug" | "keys" | "description", value: string = ""): string {
		if (value) {
			value = name === "slug" ? value.replace(/[^a-z0-9_]/gi, "").toLowerCase() : value;
			this[name].set(session.lang, value);
			return value;
		}
		return this[name].get(session.lang) || "";
	}

	isVisible(session: STWSession): boolean {
		// Check this visibility
		let result: boolean = session.roles.reduce((visible, role) => {
			const roleVisibility = this.visibility.get(role);
			return visible || (roleVisibility !== undefined ? roleVisibility : false);
		}, false);

		// Walk webbase from this up
		let element = this.parent;
		while (!result && element) {
			result = session.roles.reduce((visible, role) => {
				const roleVisibility = element.visibility.get(role);
				return visible || (roleVisibility !== undefined ? roleVisibility : false);
			}, false);

			element = element.parent;
		}
		return result;
	}

	// Export element as XML
	export(): string {
		return `<>`;
	}

	async render(_req: Request, _session: STWSession | null = null, _body: string = ""): Promise<Response> {
		return await new Response(null, { status: 204 }); // 204 No Content
	};
}

interface ISTWArea extends ISTWElement {
	mainpage: string;
}
export class STWArea extends STWElement {
	mainpage: string;

	constructor(area: ISTWArea) {
		super(area);

		this.mainpage = area.mainpage;
	}

	override async render(req: Request, _session: STWSession | null = null, _body: string = ""): Promise<Response> {
		return await STWSite.index.get(this.mainpage)?.render(req) || new Response(null, { status: 204 });
	}
}

interface ISTWSite extends ISTWArea {
	hostname: string;
	port: number;
	lang: string;
	langs: string[];
	datasources: object;
}
export class STWSite extends STWArea {
	hostname: string;
	port: number;
	lang: string;
	langs: string[];
	datasources: Map<string, string>;
	static index: Map<string, STWElement>;

	constructor(site: ISTWSite) {
		STWSite.index = new Map();

		super(site);

		this.hostname = site.hostname || "127.0.0.1";
		this.port = site.port || 80;
		this.lang = site.lang || "en";
		this.langs = site.langs || ["en"];
		this.datasources = new Map(Object.entries(site.datasources || { name: "STW", value: "" }));
	}

	// Find the element given an _id or permalink
	find(session: STWSession, selector: string): STWElement | undefined {
		if (selector.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i))
			return STWSite.index.get(selector);
		if (selector === "/")
			return STWSite.index.get(this.mainpage);
		return this.recurse(session, this.children, selector.split("/"));
	}

	private recurse(session: STWSession, children: STWElement[], slugs: string[], i: number = 1): STWElement | undefined {
		for (const child of children) {
			if (child.localize(session, "slug") === slugs[i]) {
				if (i === slugs.length)
					return child;
				this.recurse(session, child.children, slugs, i + 1);
			}
		}
		return undefined;
	}
}

interface ISTWPage extends ISTWElement {
	template: string;
}
export class STWPage extends STWElement {
	template: string;

	constructor(page: ISTWPage) {
		super(page);
		this.template = page.template || "/index.html";
	}

	override async render(req: Request, _session: STWSession | null = null, _body: string = ""): Promise<Response> {
		return await serveFile(req, `./public/${this.template}`);;
	}
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

	constructor(content: ISTWContent) {
		super(content);

		this.type = content.subtype;
		this.cssClass = content.cssClass;
		this.section = content.section;
		this.sequence = content.sequence || 0.0;
		this.dsn = content.dsn;
		this.query = content.query;
		this.parameters = content.parameters;
		this.layout = new Map(Object.entries(content.layout) || {});
	}

	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		// TODO: layout

		const data = {
			verb: "PUT",
			id: this._id,
			section: this.section,
			sequence: this.sequence,
			body: `
				<article id="${this._id}" class="${this.cssClass || "stw" + this.type}">
					<h1>Caption</h1>
					<header>Header</header>
					${_body}
					</footer>Footer</footer>
				</article>`,
		}
		return await new Response(JSON.stringify(data), { status: 200 });
	}
}

// Map STW constructors
STWFactory.Area = STWArea;
STWFactory.Page = STWPage;
