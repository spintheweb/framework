/**
 * Spin the Web Tree content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWTree extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		if (!this.isVisible(_session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		return super.serve(_req, _session, _body);
	}
}

STWFactory.Tree = STWTree;