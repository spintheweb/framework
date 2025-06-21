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

	// TODO: Render
	public override render(_req: Request, _session: STWSession, _records: ISTWRecords): string {
		const layout = this.layout.get(_session.lang);

		let body = "";
		if (_records.rows?.length) {
			let row: number = 0;

			const placeholders = new Map(_session.placeholders);
			for (const [name, value] of Object.entries(_records.rows[0]))
				placeholders.set(`@@${name}`, String(value));

			body = `<table><thead><tr>${layout?.render("TableH", _req, _session, _records.fields as any, placeholders)}</tr></thead><tbody>`;
			while (true) {
				body += `<tr>${layout?.render(this.type, _req, _session, _records.fields as any, placeholders)}</tr>`;
				if (++row >= _records.rows.length || row >= parseInt(layout?.settings.get("rows") || "25"))
					break;
				for (const [name, value] of Object.entries(_records.rows[row]))
					placeholders.set(`@@${name}`, String(value));
			}
			body += "</tbody></table>";
		}
		return body;
	}
}

STWFactory.Table = STWTable;