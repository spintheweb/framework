/**
 * Spin the Web Site element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWSite } from "./stwSite.ts";

export type STWRole = string;
export type STWLocalized = Map<string, string>;
export type STWVisibility = Map<STWRole, boolean>;

export interface ISTWElement {
	_id: string;
	type: string;
	subtype: string;
	name: object;
	slug: object;
	keys: object;
	description: object;
	visibility: object;
	children: ISTWElement[];
	modified: number;
}
export abstract class STWElement {
	_id: string;
	type: string;
	name: STWLocalized;
	slug: STWLocalized;
	keywords: STWLocalized;
	description: STWLocalized;
	visibility!: STWVisibility;
	parent!: STWElement;
	children: STWElement[] = [];
	modified: number;

	constructor(element: ISTWElement) {
		this._id = element._id ? element._id : crypto.randomUUID();
		this.type = element.type || this.constructor.name.replace("STW", "");
		this.name = new Map(Object.entries(element.name || { "en": `New ${this.type}` }));
		this.slug = new Map(Object.entries(element.slug || { "en": `New ${this.type}`.replace(/[^a-z0-9_]/gi, '').toLowerCase() }));
		this.keywords = new Map(Object.entries(element.keys || {}));
		this.description = new Map(Object.entries(element.description || {}));
		this.visibility = new Map(Object.entries(element.visibility || {}));
		this.modified = element.modified || Date.now();

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

	permalink(session: STWSession): string {
		if (this.parent)
			return this.parent.permalink(session) + "/" + this.localize(session, "slug");
		return "";
	}

	localize(session: STWSession, name: "name" | "slug" | "keywords" | "description", value: string = ""): string {
		if (value) {
			value = name === "slug" ? value.replace(/[^a-z0-9_]/gi, "").toLowerCase() : value;
			this[name].set(session.lang, value);
			return value;
		}
		return this[name].get(session.lang) || "";
	}

	/**
	 * This method determines if the element is visible to the given session.
	 * 
	 * @param session The given session
	 * @returns Return the highest access control associated to the given session
	 */
	isVisible(session: STWSession, recurse: boolean = false): number {
		let ac!: number;

		if (STWSite.get().mainpage === this._id)
			ac = recurse ? 0b11 : 0b01; // Home page always visible

		for (let i = 0; ac != 0b01 && i < session.roles.length; ++i)
			if (this.visibility.has(session.roles[i]))
				ac |= this.visibility.get(session.roles[i]) ? 0b01 : 0b00;

		if (typeof ac === "undefined") {
			const obj: STWElement = this.parent;
			if (obj)
				ac = 0b10 | obj.isVisible(session, true);
			else if (["Site", "Area", "Page"].indexOf(this.type) === -1) // Content
				ac = 0b10; // NOTE: this covers contents without a parent nor a RBV, it's in limbo!
		}

		return ac || 0b00;
	}

	// Export element as XML
	export(): string {
		return "";
	};

	abstract serve(_req: Request, _session: STWSession, _body: string): Promise<Response>;
}
