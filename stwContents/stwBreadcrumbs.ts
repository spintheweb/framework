/**
 * Spin the Web Breadcrumbs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWBreadcrumbs extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}
	public override render(_req: Request, session: STWSession): string {
		let body = "";
		for (let element = session.site.find(session, new URL(_req.url).pathname); element; element = element.parent)
			if (element.isVisible(session) & 1 && element.pathname(session))
				body = `/<a href="${element.pathname(session)}">${element.name.get(session.lang)}</a>` + body;

		return `<nav>${body}</nav>`;
	}
}

STWFactory.Breadcrumbs = STWBreadcrumbs;