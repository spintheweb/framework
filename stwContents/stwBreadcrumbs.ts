/**
 * Spin the Web Breadcrumbs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWBreadcrumbs extends STWContent {
    constructor(content: ISTWContent) {
        super(content);
    }
    override render(_req: Request, _session: STWSession, _body: string): Response {
        _body = "";
        for (let element = this.parent; element; element = element.parent) 
            _body = `/<a href="/${this._id}">${element.name.get(_session.lang)}</a>` + _body;

        return super.render(_req, _session, `<nav>${_body}</nav>`);
    }
}

STWFactory.Breadcrumbs = STWBreadcrumbs;