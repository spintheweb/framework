// SPDX-License-Identifier: MIT
// Spin the Web module: stwContents/stwCodeeditor.ts

import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWCodeeditor extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	// deno-lint-ignore require-await
	public override async render(_req: Request, _session: STWSession, _records: ISTWRecords): Promise<string> {
		return `<div id="CodeEditor${this._id}"></div>
			<script name="ace" src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/mode-html.js"></script>
			<script name="STWCodeeditor" onload="fnSTWCodeeditor('CodeEditor${this._id}')">
				function fnSTWCodeeditor(id) {
					if (typeof ace !== "undefined") {
						var editor = ace.edit(id);
						editor.setTheme("ace/theme/monokai");
						editor.session.setMode("ace/mode/html");
					} else
					 	self.document.getElementById(id).innerHTML = 'Ace Editor not loaded, see <a target="_blank" href="https://ace.c9.io/">https://ace.c9.io/</a>';
				}
			</script>`;
	}
}

STWFactory.Codeeditor = STWCodeeditor;
