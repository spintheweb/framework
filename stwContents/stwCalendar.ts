/**
 * Spin the Web Calendar content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWLayout } from "../stwContents/wbll.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWCalendar extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override async render(request: Request, session: STWSession, records: ISTWRecords): Promise<string> {
		const daysInMonth = getDaysInMonth(1, 2025);
		let layout = this.getLayout(session);

		if (!records.fields?.length || !records.rows?.length) 
			return layout.settings.get("nodata") || "";

		const fields = records.fields.map(f => f.name) || Object.keys(records.rows[0] || {});
		if (!layout.hasTokens) {
			this.layout.set(session.lang, new STWLayout(layout.wbll + "lf".repeat(fields.length)));
			layout = this.getLayout(session);
		}

		const placeholders = new Map(session.placeholders);
		for (const [name, value] of Object.entries(records.rows[0]))
			placeholders.set(`@@${name}`, String(value));

		// Month rendering
		let body = `<div class="stw${layout?.settings.get("period") || "Month"}">`;
		for (let day = 1; day <= daysInMonth; day++) 
			body += `<div data-day="${day}">${await layout?.render(this.type, request, session, fields, new Map())}</div>`;
		return body;

		function getDaysInMonth(month: number, year: number): number {
			return new Date(year, month, 0).getDate();
		}
	}
}

STWFactory.Calendar = STWCalendar;