/**
 * Spin the Web Table content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwDatasources.ts";

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

			// Merge record and session placeholders
			const placeholders = new Map(_session.placeholders);
			Object.entries(_records.rows[0]).forEach((key, value) => placeholders.set(`@@${key}`, value.toString()));
			
			body = `<table><thead><tr>${layout?.render(_req, _session, _records, placeholders)}</tr></thead><tbody>`;
			while (true) {
				body += `<tr>${layout?.render(_req, _session, _records, placeholders)}</tr>`;
				if (++row > _records.rows.length || row > parseInt(layout?.settings.get("rows") || "25"))
					break;
				Object.entries(_records.rows[row]).forEach((key, value) => placeholders.set(`@@${key}`, value.toString()));
			}
			body += "</tbody></table>";
		}
		return body;
	}

	private renderrow(_req: Request, _session: STWSession, _records: ISTWRecords): string {
		return "";
	}
}

STWFactory.Table = STWTable;