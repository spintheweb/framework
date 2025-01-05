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
	override render(_req: Request, _session: STWSession): string {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="350">
			<ellipse
			cx="258" cy="169" rx="250" ry="80"
			transform="matrix(0.866025,-0.5,0.5,0.866025,-46,152)"
			style="fill:none;stroke:black;stroke-width:3" />
		</svg>`;
	}
}

STWFactory.Plot = STWPlot;