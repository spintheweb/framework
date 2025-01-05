/**
 * Spin the Web Plot content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";

export class STWPlot extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override serve(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		if (!this.isVisible(_session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		_body = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="350">
			<ellipse
			cx="258" cy="169" rx="250" ry="80"
			transform="matrix(0.866025,-0.5,0.5,0.866025,-46,152)"
			style="fill:none;stroke:black;stroke-width:3" />
		</svg>`;

		return super.serve(_req, _session, _body);
	}
}

STWFactory.Plot = STWPlot;