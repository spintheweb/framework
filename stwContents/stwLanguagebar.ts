/**
 * Spin the Web Language bar content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWSite } from "../stwElements/stwSite.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWLanguagebar extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override serve(_req: Request, _session: STWSession): Promise<Response> {
		if (STWSite.get().langs.length == 1)
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		return super.serve(_req, _session);
	}

	override render(_req: Request, _session: STWSession): string {
		return `<nav>${STWSite.get().langs.reduce((langs, lang) => `${langs}<a href="/stw/language/${lang}">${lang.toUpperCase()}</a> `, "")}</nav>`;
	}
}

STWFactory.Languagebar = STWLanguagebar;