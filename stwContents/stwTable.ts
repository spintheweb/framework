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

		const placeholders = new Map(session.placeholders);

		let body = "<table><thead><tr>";
		let tr = layout.render(request, session, fields, placeholders, layout.isInteractive && !layout.settings.get("disabled"));
		tr.matchAll(/(<label.*?>(.*?)<\/label>).*?/g).forEach(match => body += `<th>${match[2].trim()}</th>`);

		// If the layout includes an insert button, allow records insertion
		if (layout.isInteractive && !layout.settings.get("disabled")) {
			body += `<th style="width:1rem"></th><tr>`;
			tr = layout.render(request, session, fields, placeholders, true);
			tr.matchAll(/<label(.*?)>(.*?)<\/label>(.*?)(?=<label|$)/g).forEach(match => body += `<td${match[1].trim()}>${match[3].trim()}</td>`);
			body += `<td><i class="fa-light fa-fw fa-plus"></i></td>`;
		}
		body += "</tr></thead><tbody>";

		let row = 0;
		while (true) {
			for (const [name, value] of Object.entries(records.rows[row]))
				placeholders.set(`@@${name}`, String(value));
			tr = layout.render(request, session, fields, placeholders, layout.isInteractive && !layout.settings.get("disabled"));

			body += `<tr ${wbpl(layout.groupAttributes, placeholders)}>`;
			tr.matchAll(/<label(.*?)>(.*?)<\/label>(.*?)(?=<label|$)/g).forEach(match => body += `<td${match[1].trim()}>${match[3].trim()}</td>`);

			// If the layout includes a delete button, allow records deletion
			if (layout.isInteractive && !layout.settings.get("disabled"))
				body += `<td><i class="fa-light fa-fw fa-trash-can"></i></td>`;

			body += "</tr>";

			if (++row >= records.rows.length || row >= parseInt(layout.settings.get("rows") || "25"))
				break;
		}

		body += "</tbody></table>";

		// Remove all <button> elements from the body
		body = body.replace(/<button.*?<\/button>/g, "");

		return body;
	}
}

STWFactory.Table = STWTable;