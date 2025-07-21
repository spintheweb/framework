/**
 * Spin the Web Breadcrumbs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ACTIONS, isTruthy } from "../stwContents/wbll.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWBreadcrumbs extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	// deno-lint-ignore require-await
	public override async render(request: Request, session: STWSession, records: ISTWRecords): Promise<string> {
		const layout = this.getLayout(session);

		const fields = records.fields.map(f => f.name) || Object.keys(records.rows[0] || {});

		const placeholders = new Map(session.placeholders);
		if (records.rows?.length)
			for (const [name, value] of Object.entries(records.rows[0]))
				placeholders.set(`@@${name}`, String(value));

		let body = "";
		for (let element = session.site.find(session, new URL(request.url).pathname); element; element = element.parent)
			if (element.isVisible(session) & 1 && element.pathname(session))
				body = `/<a href="${element.pathname(session)}">${element.localize(session, "name")}</a>` + body;

		body = `<nav>${body}</nav>` + this.layout.get(session.lang)?.render(request, session, fields, placeholders, layout.acts(ACTIONS.stwany) && !isTruthy(layout.settings.get("disabled"))) || "";

		return body;
	}
}

STWFactory.Breadcrumbs = STWBreadcrumbs;