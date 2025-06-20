/**
 * Spin the Web Form content
 * 
 * A form content 
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWForm extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override render(_req: Request, session: STWSession, _records: ISTWRecords): string {
		let body = "";

		// Merge record and session placeholders
		const placeholders = new Map(session.placeholders);
		if (_records.rows?.length)
			for (const [name, value] of Object.entries(_records.rows[0]))
				placeholders.set(`@@${name}`, String(value));

		body += this.layout.get(session.lang)?.render(this.type, _req, session, _records.fields as any, placeholders);

		// If the form is inside a dialog, method="dialog"
		return `<form method="${this.section.startsWith("stwDialog") ? "dialog" : "post"}">
			<input type="hidden" name="stwOrigin" value="${this._id}">
			${body}
		</form>`;
	}
}

STWFactory.Form = STWForm;