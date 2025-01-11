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
	override render(_req: Request, _session: STWSession): string {
		let body = "";
		for (let element = STWSite.get().find(_session, new URL(_req.url).pathname); element; element = element.parent)
			if (element.isVisible(_session) & 1 && element.pathname(_session))
				body = `/<a href="${element.pathname(_session)}">${element.name.get(_session.lang)}</a>` + body;

		return `<nav>${body}</nav>`;
	}
}

STWFactory.Breadcrumbs = STWBreadcrumbs;