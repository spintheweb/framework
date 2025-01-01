/**
 * Spin the Web Page element
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { serveFile } from "jsr:@std/http/file-server";
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWElement, ISTWElement } from "./stwElement.ts";

interface ISTWPage extends ISTWElement {
    template: string;
}
export class STWPage extends STWElement {
    template: string;

    constructor(page: ISTWPage) {
        super(page);
        this.template = page.template || "/index.html";
    }

    override serve(_req: Request, _session: STWSession | null = null, _body: string = ""): Promise<Response> {
        // TODO: Collection of contents in cookie
        
        return serveFile(_req, `./public/${this.template}`);
    }
}

STWFactory.Page = STWPage;