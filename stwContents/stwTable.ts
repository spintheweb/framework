/**
 * Spin the Web Table content
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

export class STWTable extends STWContent {
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

		const header = await layout.render("TableH", request, session, fields, placeholders);
		body = `<table><thead><tr><th>${header}</th></tr></thead><tbody>`;

		while (true) {
			body += `<tr${wbpl(layout.groupAttributes, placeholders)}><td>${await layout.render(this.type, request, session, fields, placeholders)}</td></tr>`;
			if (++row >= records.rows.length || row >= parseInt(layout.settings.get("rows") || "25"))
				break;
			for (const [name, value] of Object.entries(records.rows[row]))
				placeholders.set(`@@${name}`, String(value));
		}

		body += "</tbody></table>";

		return body;
	}
}

STWFactory.Table = STWTable;