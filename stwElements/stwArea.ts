/**
 * Spin the Web Area element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { ISTWElement, STWElement } from "./stwElement.ts";
import { STWSite } from "./stwSite.ts";

export interface ISTWArea extends ISTWElement {
	mainpage: string;
	version: string;
}
export class STWArea extends STWElement {
	mainpage: string;
	version: string;

	constructor(area: ISTWArea) {
		super(area);

		this.mainpage = area.mainpage;
		this.version = area.version || `v1.0.0 ${new Date().toISOString()}`
	}

	// deno-lint-ignore no-explicit-any
	override serve(req: Request, session: STWSession, _shortcut: any): Promise<Response> {
		const page = STWSite.index.get(this.mainpage);

		return page?.serve(req, session, undefined) ||
			new Promise<Response>(resolve => {
				const response = new Response(`Area '${this.localize(session, "name")}' main page not found`, { status: 404, statusText: "Not Found" });
				resolve(response);
			});
	}
}

STWFactory.Area = STWArea;