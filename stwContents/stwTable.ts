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
	constructor(content: ISTWContent) {
		super(content);
	}

	override render(_req: Request, session: STWSession, _records: ISTWRecords): string {
		return `TODO: Render ${this.constructor.name} for ${session.user} <pre>${_records}</pre>`;
	}
}

STWFactory.Table = STWTable;