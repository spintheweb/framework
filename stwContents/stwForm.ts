/**
 * Spin the Web Form content
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
		// const _records = STWDatasources.query(this);

		// If the from is inside a dialog, method="dialog"

		return `<form method="${this.section.endsWith("dialog") ? "dialog" : "post"}" enctype="multipart/form-data" name="${this.localize(_session, "slug")}">${this.localize(_session, "layout")}</form>`;
	}
}

STWFactory.Form = STWForm;