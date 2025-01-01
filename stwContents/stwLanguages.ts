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
    override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
        // If there is only one language makes no sense to render content
        if (STWSite.get().langs.length > 1) {
            _body = `<nav>${STWSite.get().langs.reduce((langs, lang) => `${langs}<a href="/stw/language/${lang}">${lang.toUpperCase()}</a> `, "")}</nav>`;
            return super.serve(_req, _session, _body);
        }

        return new Promise<Response>(resolve => {
            const response = new Response(null, { status: 204 }); // 204 No Content
            resolve(response);
        });
    }
}

STWFactory.Languages = STWLanguages;