/**
 * Spin the Web Calendar content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWCalendar extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override render(_req: Request, session: STWSession, _records: ISTWRecords): string {
		const layout = this.layout.get(session.lang), daysInMonth = getDaysInMonth(1, 2025);

		// Month rendering
		let body = `<div class="stw${layout?.settings.get("period") || "Month"}">`;
		for (let day = 1; day <= daysInMonth; day++) 
			body += `<div data-day="${day}">${layout?.render(this.type, _req, session, _records, new Map())}</div>`;
		return body;

		function getDaysInMonth(month: number, year: number): number {
			return new Date(year, month, 0).getDate();
		}
	}
}

STWFactory.Calendar = STWCalendar;