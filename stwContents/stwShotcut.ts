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
	override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		// If the shortcut reference is undefined makes no sense to continue
		if (!this.isVisible(_session) || !this.reference)
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		return super.serve(_req, _session, _body);
	}
}

STWFactory.Tree = STWShortcut;