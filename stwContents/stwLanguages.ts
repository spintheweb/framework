/**
 * Spin the Web Languages content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWSite } from "../stwElements/stwSite.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWLanguages extends STWContent {
    constructor(content: ISTWContent) {
        super(content);
    }
    override render(_req: Request, _session: STWSession, _body: string): Response {
        // If there is only one language makes no sense to render content
        if (STWSite.load().langs.length > 1) {
            _body = `<nav>${STWSite.load().langs.reduce((langs, lang) => `${langs}<a href="/stw/language/${lang}">${lang.toUpperCase()}</a> `, "")}</nav>`;
            return super.render(_req, _session, _body);
        }
        return new Response(null, { status: 204 }); // 204 No Content
    }
}

STWFactory.Languages = STWLanguages;