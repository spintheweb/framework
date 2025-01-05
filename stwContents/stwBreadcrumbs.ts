/**
 * Spin the Web Breadcrumbs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWSite } from "../stwElements/stwSite.ts";

export class STWBreadcrumbs extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		if (!this.isVisible(_session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		for (let element = STWSite.get().find(_session, new URL(_req.url).pathname); element; element = element.parent)
			if (element.isVisible(_session) & 1)
				_body = `/<a href="${element.permalink(_session)}">${element.name.get(_session.lang)}</a>` + _body;

		return super.serve(_req, _session, `<nav>${_body}</nav>`);
	}
}

STWFactory.Breadcrumbs = STWBreadcrumbs;