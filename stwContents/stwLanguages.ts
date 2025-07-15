/**
 * Spin the Web Language bar content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWLanguages extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}
	
	override serve(_req: Request, session: STWSession): Promise<Response> {
		if (session.site.langs.length == 1)
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		return super.serve(_req, session, undefined);
	}

	// deno-lint-ignore require-await
	public override async render(_req: Request, session: STWSession): Promise<string> {
		return `<nav>${session.site.langs.reduce((langs, lang) => `${langs}<a href="/stw/language/${lang}">${lang.toUpperCase()}</a> `, "")}</nav>`;
	}
}

STWFactory.Languages = STWLanguages;