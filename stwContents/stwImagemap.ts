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
	public constructor(content: ISTWContent) {
		super(content);
	}
	
	// TODO: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
	public override render(_req: Request, _session: STWSession): string {
		return `TODO: Render ${this.constructor.name} for ${_session.user}`;
	}
}

STWFactory.Imagemap = STWImagemap;