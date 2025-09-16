// SPDX-License-Identifier: MIT
// Spin the Web module: stwContents/stwGraph.ts

import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWGraph extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	// deno-lint-ignore require-await
	public override async render(_req: Request, _session: STWSession, _records: ISTWRecords): Promise<string> {
		return `TODO: Render ${this.constructor.name} <pre>${_records}</pre>`;
	}
}

STWFactory.Tree = STWGraph;