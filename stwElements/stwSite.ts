/**
 * Spin the Web Site element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession } from "../stwSession.ts";
import { ISTWElement, STWElement } from "./stwElement.ts";

interface ISTWSite extends ISTWElement {
	lang: string;
	langs: string[];
	roles: object;
	datasources: object;
	mainpage: string;
}
export class STWSite extends STWElement {
	static #instance: STWSite;

	static index: Map<string, STWElement> = new Map();

	lang: string;
	langs: string[];
	datasources: Map<string, string>;
	mainpage: string;

	private constructor(site: ISTWSite) {
		super(site);

		this.lang = site.lang || "en";
		this.langs = site.langs || ["en"];
		this.datasources = new Map(Object.entries(site.datasources || { name: "STW", value: "" }));
		this.mainpage = site.mainpage;
	}

	/**
	 * Loads webbase in memory if not loaded and return the singleton.
	 * 
	 * @returns STWSite Singleton 
	 */
	static get(): STWSite {
		if (!STWSite.#instance) {
			const webbase = Deno.env.get("WEBBASE") || "./public/.data/webbase.json";
			STWSite.#instance = new STWSite(JSON.parse(Deno.readTextFileSync(webbase)));
			if (!STWSite.#instance)
				console.info(`Webbase '${webbase}' not found. Set WEBBASE="<path>" in the .env file or place the webbase in ${webbase}.`);
		}
		return STWSite.#instance;
	}

	// Find the element given an _id or permalink
	find(session: STWSession, resource: string): STWElement | null {
		if (resource.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i))
			return STWSite.index.get(resource) || null;
		if (resource === "/")
			return STWSite.index.get(STWSite.#instance.mainpage) || null;
		return STWSite.#instance.recurse(session, STWSite.#instance.children, resource.split("/"));
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

	override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		const page = STWSite.index.get(this.mainpage);

		return page?.serve(_req, _session, _body) ||
			new Promise<Response>(resolve => {
				const response = new Response(`Site ${this.localize(_session, "name")} home page not found`, { status: 404, statusText: "Not Found" });
				resolve(response);
			});
	}

	override export(): string {
		let fragment: string = "";
		this.children.forEach(child => fragment += child.export());

		return '<?xml version="1.0" encoding="utf-8"?>\n' +
			'<wbml version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://webspinner.org" xsi:schemaLocation="https://webspinner.org/schemas wbol.xsd">\n' +
			`<!--Spin the Web (TM) webbase generated ${(new Date()).toISOString()}-->\n` +
			`<site id="${this._id}" language="${this.lang}" languages="${this.langs}" mainpage="${this.mainpage}">\n${super.export()}${fragment}</site>\n` +
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
			else if (element.type === "Page" && element.isVisible(session))
				fragment += `<url><loc>${element.permalink(session)}</loc><lastmod>${element.modified}</lastmod><priority>0.5</priority></url>\n`;
		}
	}
}
