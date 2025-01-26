/**
 * Spin the Web Site element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession } from "../stwSession.ts";
import { ISTWArea, STWArea } from "./stwArea.ts";
import { ISTWElement, STWElement } from "./stwElement.ts";

interface ISTWSite extends ISTWElement {
	langs: string[];
	roles: object;
	datasources: object;
	mainpage: string;
	version: string;
}
export class STWSite extends STWElement {
	static #instance: STWSite;

	static index: Map<string, STWElement> = new Map();

	langs: string[];
	datasources: Map<string, string>;
	mainpage: string;
	version: string;

	private constructor(site: ISTWSite) {
		super(site);

		this.langs = site.langs || ["en"];
		this.datasources = new Map(Object.entries(site.datasources || { name: "STW", value: "" }));
		this.mainpage = site.mainpage;
		this.version = site.version || `v1.0.0 ${new Date().toISOString()}`

		STWSite.index.set(site._id, this);
	}

	/**
	 * Loads webbase in memory if not loaded and return the singleton.
	 * 
	 * @returns STWSite Singleton 
	 */
	static get(): STWSite {
		if (!STWSite.#instance) {
			console.info(`${new Date().toISOString()}: Loading webbase '${Deno.env.get("SITE_WEBBASE")}'...`);

			const webbase = Deno.env.get("SITE_WEBBASE") || "./public/.data/webbase.wbml";
			STWSite.#instance = new STWSite(JSON.parse(Deno.readTextFileSync(webbase)));
			if (!STWSite.#instance)
				throw new Error(`Webbase '${webbase}' not found. Set SITE_WEBBASE="<path>" in the .env file or place the webbase in ${webbase}.`);
			STWSite.#instance.loadStudio();
		}
		return STWSite.#instance;
	}
	
	/**
	 * Load Spin the Web Studio webbase, if it's already present, replace it.
	 */
	loadStudio(): void {
		console.info(`${new Date().toISOString()}: Loading STW Studio '${Deno.env.get("STUDIO_WEBBASE")}'...`);

		try {
			if (URL.parse(Deno.env.get("STUDIO_WEBBASE") || "")) {
				fetch(new URL(Deno.env.get("STUDIO_WEBBASE") || ""))
					.then(response => response.json())
					.then(webbaselet => load(webbaselet))
					.catch(_error => { throw _error });
			} else
				load(JSON.parse(Deno.readTextFileSync(Deno.env.get("STUDIO_WEBBASE") || "./stwStudio.wbml")));

		} catch (error) {
			console.error(`${(error as Error).name}: ${(error as Error).message}`);
		}

		function load(webbaselet: ISTWArea) {
			const studio = STWSite.index.get(webbaselet._id); // uuid = e258daa0-293a-11ee-9729-21da0b1a268c
			if (studio)
				STWSite.#instance.delete(studio._id);

			STWSite.#instance.children.unshift(new STWArea(webbaselet));
			STWSite.#instance.children[0].parent = STWSite.#instance;
		}
	}

	/**
	 * Remove the element _id with all its descendent from the webbase
	 * 
	 * @param _id The UUID of the element to be removed
	 */
	delete(_id: string): void {
		const element = STWSite.index.get(_id);
		element?.children.forEach((child, i) => {
			this.delete(child._id);
			STWSite.index.delete(child._id);
			element.children.splice(i, 1);
		});
	}

	// Find the element given an _id or permalink
	find(session: STWSession, ref: string): STWElement | null {
		if (ref.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i))
			return STWSite.index.get(ref) || null;
		if (ref === "/")
			return STWSite.index.get(STWSite.#instance.mainpage) || null;
		return STWSite.#instance.recurse(session, STWSite.#instance.children, ref.split("/"));
	}

	private recurse(session: STWSession, children: STWElement[], slugs: string[], i: number = 1): STWElement | null {
		let result: STWElement | null = null;
		for (const child of children) {
			if (child.localize(session, "slug") === slugs[i]) {
				if (i + 1 === slugs.length)
					return child;
				result = STWSite.#instance.recurse(session, child.children, slugs, i + 1);
				if (result)
					return result;
			}
		}
		return result;
	}

	// deno-lint-ignore no-explicit-any
	override serve(req: Request, session: STWSession, _shortcut: any): Promise<Response> {
		const page = STWSite.index.get(this.mainpage);

		return page?.serve(req, session, undefined) ||
			new Promise<Response>(resolve => {
				const response = new Response(`Site ${this.localize(session, "name")} home page not found`, { status: 404, statusText: "Not Found" });
				resolve(response);
			});
	}

	override export(): string {
		let fragment: string = "";
		this.children.forEach(child => fragment += child.export());

		return '<?xml version="1.0" encoding="utf-8"?>\n' +
			'<wbml version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://webspinner.org" xsi:schemaLocation="https://webspinner.org/schemas wbol.xsd">\n' +
			`<!--Spin the Web (TM) webbase generated ${(new Date()).toISOString()}-->\n` +
			`<site id="${this._id}" language="${this.langs[0]}" languages="${this.langs}" mainpage="${this.mainpage}">\n${super.export()}${fragment}</site>\n` +
			'</wbml>';
	}

	// Build a site map (see sitemaps.org) that includes the urls of the visible pages in the site
	sitemap(session: STWSession): Promise<Response> {
		let fragment = "";
		_url(this);

		return new Promise<Response>(resolve =>
			resolve(new Response(`<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fragment}</urlset>`))
		);

		function _url(element: STWElement) {
			if (element.type === "Area" && element.children.length > 0)
				element.children.forEach(child => _url(child));
			else if (element.type === "Page" && element.isVisible(session) & 1)
				fragment += `<url><loc>${element.pathname(session)}</loc><lastmod>${element.modified}</lastmod><priority>0.5</priority></url>\n`;
		}
	}
}
