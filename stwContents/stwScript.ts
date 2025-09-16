// SPDX-License-Identifier: MIT
// Spin the Web module: stwContents/stwScript.ts

import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWScript extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}
	
	public override serve(_req: Request, _session: STWSession): Promise<Response> {
		if (!this.isVisible(_session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		const data = {
			method: "PUT",
			id: this._id,
			section: this.section,
			sequence: this.sequence,
			body: this.layout.get(_session.lang),
		};
		return new Promise<Response>(resolve => {
			const response = new Response(`<script>${JSON.stringify(data)}</script>`);
			resolve(response);
		});
	}
}

STWFactory.Script = STWScript;