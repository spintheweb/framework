/**
 * Spin the Web Shortcut content
 * 
 * A STWShortcut points to a content somewhere in the webbase
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWSite } from "../stwElements/stwSite.ts";

export interface ISTWShortcut extends ISTWContent {
	ref: string;
}
export class STWShortcut extends STWContent {
	ref: string;

	public constructor(content: ISTWShortcut) {
		super(content);

		this.ref = content.ref;
	}
	
	public override serve(_req: Request, _session: STWSession): Promise<Response> {
		const ref = STWSite.index.get(this.ref);

		if (!(ref instanceof STWContent) || !this.isVisible(_session) || !ref || ref instanceof STWShortcut)
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		console.debug(`${new Date().toISOString()}: ├┬ ${this.type} (${this.pathname(_session)}) @${this.section}.${this.sequence} [${this._id}]`);

		return ref.serve(_req, _session, this);
	}
}

STWFactory.Shortcut = STWShortcut;