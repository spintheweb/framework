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
    override render(_req: Request, _session: STWSession, _body: string): Response {
        return super.render(_req, _session, _body);
    }
}

STWFactory.Tree = STWTree;