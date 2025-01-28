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
		if (_records.rows) {
			body += `<thead><tr>${layout?.render(_req, _session, _records, -1)}</tr></thead><tbody>`;
			for (let row = 0; row < _records.rows.length && row < parseInt(layout?.settings.get("rows") || "25"); ++row)
				body += `<tr>${layout?.render(_req, _session, _records, row)}</tr>`;
			body += "</tbody>";
		}

		return `<table>${body}</table>`;
	}
}

STWFactory.Table = STWTable;