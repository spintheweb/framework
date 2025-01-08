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
import { STWDatasources } from "../stwDatasources.ts";

export class STWForm extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override render(_req: Request, _session: STWSession): string {
		const _records = STWDatasources.query(this);

		// If the form is inside a dialog, method="dialog"
		return `<form method="${this.section.endsWith("dialog") ? "dialog" : ""}">
			<input type="hidden" name="stworigin" value="${this._id}">
			${this.localize(_session, "layout")}
		</form>`;
	}
}

STWFactory.Form = STWForm;