/**
 * Spin the Web List content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWLayout } from "../stwContents/wbll.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";
import { wbpl } from "../stwComponents/wbpl.ts";

export class STWList extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override async render(request: Request, session: STWSession, records: ISTWRecords): Promise<string> {
		let layout = this.getLayout(session);

		if (!records.fields?.length || !records.rows?.length) 
			return layout.settings.get("nodata") || "";

		const fields = records.fields.map(f => f.name) || Object.keys(records.rows[0] || {});
		if (!layout.hasTokens) {
			this.layout.set(session.lang, new STWLayout(layout.wbll + "lf".repeat(fields.length)));
			layout = this.getLayout(session);
		}

		let body = "";
		let row = 0;

		const placeholders = new Map(session.placeholders);
		for (const [name, value] of Object.entries(records.rows[0]))
			placeholders.set(`@@${name}`, String(value));

		body = `<ul>`;
		while (true) {
			body += `<li${wbpl(layout.groupAttributes, placeholders)}>${await layout.render(this.type, request, session, fields, placeholders)}</li>`;
			if (++row >= records.rows.length || row >= parseInt(layout.settings.get("rows") || "25"))
				break;
			for (const [name, value] of Object.entries(records.rows[row]))
				placeholders.set(`@@${name}`, String(value));
		}
		body += "</ul>";

		return body;
	}
}

STWFactory.List = STWList;