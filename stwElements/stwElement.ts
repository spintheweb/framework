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

	public constructor(element: ISTWElement) {
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

	/**
	 * @param session The session
	 * @returns Return a / separated reverse chain of slugs of this element up to the root element
	 */
	public pathname(session: STWSession): string {
		if (this.parent)
			return this.parent.pathname(session) + "/" + this.localize(session, "slug");
		return "";
	}

	public localize(session: STWSession, name: "name" | "slug" | "keywords" | "description", value: string = ""): string {
		if (value) {
			value = name === "slug" ? value.replace(/[^a-z0-9_]/gi, "").toLowerCase() : value;
			this[name].set(session.lang, value);
			return value;
		}
		return this[name].get(session.lang) || this[name].keys().next().value || "undefined";
	}

	/**
	 * Determines the Role Based Visibility of the element climbing up the webbase hierarchy if necessary.
	 * By default an element is not visible except for the site's mainpage. Given the session roles, 
	 * apply a logical OR of these roles in element visiblity, if no role applies move to 
	 * the element parent.
	 * 
	 * @param session The session
	 * @returns Return a number greater than 0 if element visible
	 */
	public isVisible(session: STWSession, recurse: boolean = false): number {
		let ac!: number;

		if (session.site.mainpage === this._id)
			ac = recurse ? 0b11 : 0b01; // Main site page always visible

		for (let i = 0; ac != 0b01 && i < session.roles.length; ++i)
			if (this.visibility.has(session.roles[i]))
				ac |= this.visibility.get(session.roles[i]) ? 0b01 : 0b00;

		if (typeof ac === "undefined") {
			if (this.parent)
				ac = 0b10 | this.parent.isVisible(session, true);
			else if (["Site", "Area", "Page"].indexOf(this.type) === -1) // Content
				ac = 0b10; // NOTE: this covers contents without a parent nor a RBV, it's in limbo!
		}

		return ac || 0b00;
	}

	// Export element as XML
	public export(): string {
		return "";
	};

	abstract serve(req: Request, session: STWSession): Promise<Response>;
}
