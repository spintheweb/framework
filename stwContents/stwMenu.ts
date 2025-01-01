/**
 * Spin the Web Menu content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWMenu extends STWContent {
    constructor(content: ISTWContent) {
        super(content);
    }
    override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
        return super.serve(_req, _session, _body);
    }
}

STWFactory.Menu = STWMenu;