/**
 * Spin the Web Table content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWTable extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override async render(_req: Request, _session: STWSession, _records: ISTWRecords): Promise<string> {
		const layout = this.getLayout(_session);
		if (!layout || !_records.rows?.length) return "";

		let body = "";
		let row = 0;
		const placeholders = new Map(_session.placeholders);
		const fields = _records.fields?.map(f => f.name) || Object.keys(_records.rows[0] || {});

		for (const [name, value] of Object.entries(_records.rows[0])) {
			placeholders.set(`@@${name}`, String(value));
		}

		const header = await layout.render("TableH", _req, _session, fields, placeholders);
		body = `<table><thead><tr>${header}</tr></thead><tbody>`;

		while (true) {
			body += `<tr>${await layout.render(this.type, _req, _session, fields, placeholders)}</tr>`;
			if (++row >= _records.rows.length || row >= parseInt(layout.settings.get("rows") || "25")) {
				break;
			}
			for (const [name, value] of Object.entries(_records.rows[row])) {
				placeholders.set(`@@${name}`, String(value));
			}
		}
		body += "</tbody></table>";

		return body;
	}
}

STWFactory.Table = STWTable;