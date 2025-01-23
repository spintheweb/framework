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
	constructor(content: ISTWContent) {
		super(content);
	}

	override render(_req: Request, _session: STWSession, _records: ISTWRecords): string {
		let body = "";

		// Transfer record to session placeholders
		if (_records.rows?.length)
			Object.entries(_records.rows[0]).forEach((key, value) => _session.placeholders.set(`@@${key}`, value.toString()));

		body += this.layout.get(_session.lang)?.render(_req, _session);

		// If the form is inside a dialog, method="dialog"
		return `<form method="${this.section.startsWith("stwDialog") ? "dialog" : ""}">
			<input type="hidden" name="stwOrigin" value="${this._id}">
			${body}
		</form>`;
	}
}

STWFactory.Form = STWForm;