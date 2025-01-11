/**
 * Spin the Web Imagemap content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWImagemap extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	
	override render(_req: Request, _session: STWSession): string {
		return `TODO: Render ${this.constructor.name} for ${_session.user}`;
	}
}

STWFactory.Imagemap = STWImagemap;