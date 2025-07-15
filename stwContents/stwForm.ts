/**
 * Spin the Web Form content
 * 
 * A form content 
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ACTIONS, STWLayout, isTruthy } from "../stwContents/wbll.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWForm extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	// deno-lint-ignore require-await
	public override async render(request: Request, session: STWSession, records: ISTWRecords): Promise<string> {
		let layout = this.getLayout(session);

		if (!records.fields?.length || !records.rows?.length)
			return layout.settings.get("nodata") || "";

		const fields = records.fields.map(f => f.name) || Object.keys(records.rows[0] || {});
		if (!layout.hasTokens) {
			this.layout.set(session.lang, new STWLayout(layout.wbll + "l\\tf\\r".repeat(fields.length)));
			layout = this.getLayout(session);
		}

		let body = "";

		const placeholders = new Map(session.placeholders);
		if (records.rows?.length)
			for (const [name, value] of Object.entries(records.rows[0]))
				placeholders.set(`@@${name}`, String(value));

		body += this.layout.get(session.lang)?.render(request, session, fields, placeholders, layout.acts(ACTIONS.stwany) && !isTruthy(layout.settings.get("disabled")));

		// If the form is inside a dialog, method="dialog"
		return `<form method="${this.section.startsWith("stwDialog") ? "dialog" : "post"}">
			<input type="hidden" name="stwOrigin" value="${this._id}">
			${body}
		</form>`;
	}
}

STWFactory.Form = STWForm;