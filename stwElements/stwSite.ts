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
    hostname: string;
    port: number;
    lang: string;
    langs: string[];
    datasources: object;
    mainpage: string;
}
export class STWSite extends STWElement {
    static #instance: STWSite;

    static index: Map<string, STWElement> = new Map();

    hostname: string;
    port: number;
    lang: string;
    langs: string[];
    datasources: Map<string, string>;
    mainpage: string;

    private constructor(site: ISTWSite) {
        super(site);

        this.hostname = site.hostname || "127.0.0.1";
        this.port = site.port || 80;
        this.lang = site.lang || "en";
        this.langs = site.langs || ["en"];
        this.datasources = new Map(Object.entries(site.datasources || { name: "STW", value: "" }));
        this.mainpage = site.mainpage;
    }

    public static load(site: ISTWSite | null = null): STWSite {
        if (!STWSite.#instance) {
            if (site === null)
                throw new Error("Site schema not loaded");
            STWSite.#instance = new STWSite(site);
        }
        return STWSite.#instance;
    }

    // Find the element given an _id or permalink
    public find(session: STWSession, resource: string): STWElement | null {
        if (resource.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i))
            return STWSite.index.get(resource) || null;
        if (resource === "/")
            return STWSite.index.get(STWSite.load().mainpage) || null;
        return STWSite.load().recurse(session, STWSite.load().children, resource.split("/"));
    }

    private recurse(session: STWSession, children: STWElement[], slugs: string[], i: number = 1): STWElement | null {
        for (const child of children) {
            if (child.localize(session, "slug") === slugs[i]) {
                if (i === slugs.length)
                    return child;
                STWSite.load().recurse(session, child.children, slugs, i + 1);
            }
        }
        return null;
    }

	override render(_req: Request, _session: STWSession | null = null, _body: string = ""): Response {
		return STWSite.index.get(this.mainpage)?.render(_req, _session, _body) || new Response(null, { status: 404 });
	}
}
