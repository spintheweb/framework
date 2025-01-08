/**
 * Spin the Web Navigation content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent, ISTWOption } from "../stwElements/stwContent.ts";

export class STWNavigation extends STWContent {
	options: ISTWOption[] = [];

	constructor(content: ISTWContent) {
		super(content);

		this.options = [ 
			{ name: "a", pathname: "/" },
			{ name: "b", pathname: "/" },
			{ name: "c", pathname: "/" },
			{ name: "d", pathname: "/" },
			{ name: "e", pathname: "/" },
		]
	}
	override render(_req: Request, _session: STWSession): string {
		let body:string = "";
		this.options.forEach(option => {
			body += `<li><a href="${option.pathname}">${option.name}</a></li>`;
		});

		return `<nav class="stwVOrientation">${body}</nav>`;
	}
}

STWFactory.Navigation = STWNavigation;