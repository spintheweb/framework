/**
 * Spin the Web Text content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWText extends STWContent {
    constructor(content: ISTWContent) {
        super(content);
    }
    override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
        const data = {
            method: "PUT",
            id: this._id,
            section: this.section,
            sequence: this.sequence,
            body: this.layout.get(_session.lang),
        };
        return new Promise<Response>(resolve => {
            const response = new Response(JSON.stringify(data));
            resolve(response);
        });
    }
}

STWFactory.Text = STWText;