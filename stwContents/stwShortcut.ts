/**
 * Spin the Web Shortcut content
 * 
 * A STWShortcut points to a content somewhere in the webbase
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWSite } from "../stwElements/stwSite.ts";

export interface ISTWShortcut extends ISTWContent {
	reference: string;
}
export class STWShortcut extends STWContent {
	reference: STWContent | undefined;

	constructor(content: ISTWShortcut) {
		super(content);

		this.reference = STWSite.index.get(content.reference) as STWContent;
	}
	override serve(_req: Request, _session: STWSession): Promise<Response> {
		if (!this.isVisible(_session) || !this.reference || this.reference instanceof STWShortcut)
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		const data = {
			method: "PUT",
			id: this._id,
			section: this.section,
			sequence: this.sequence,
			body: this.reference.render(_req, _session),
		};
		return new Promise<Response>(resolve => {
			const response = new Response(JSON.stringify(data));
			resolve(response);
		});
	}
}

STWFactory.Shortcut = STWShortcut;