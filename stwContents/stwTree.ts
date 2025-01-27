/**
 * Spin the Web Tree content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWTree extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override render(_req: Request, _session: STWSession, _records: ISTWRecords): string {
		return `TODO: Render ${this.constructor.name} <pre>${_records}</pre>`;
	}
}

STWFactory.Tree = STWTree;