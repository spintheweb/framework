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
}
export class STWArea extends STWElement {
	mainpage: string;

	constructor(area: ISTWArea) {
		super(area);

		this.mainpage = area.mainpage;
	}

	override render(req: Request, _session: STWSession | null = null, _body: string = ""): Response {
		return STWSite.index.get(this.mainpage)?.render(req, _session, _body) || new Response(null, { status: 204 });
	}
}

STWFactory.Area = STWArea;