/**
 * Spin the Web Navigation content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent, ISTWOption } from "../stwElements/stwContent.ts";
import { STWSite } from "../stwElements/stwSite.ts";

// TODO: If the permalink of an element is changed the pathname of the corrisponding options needs to be updated
export class STWNavigation extends STWContent {
	options: ISTWOption[] = [];

	constructor(content: ISTWContent) {
		super(content);

		this.options = [
			{ name: new Map([["en", "a"]]), path: "/home" },
			{ name: new Map(), path: "/profile/area/page" },
			{ name: new Map([["en", "Spin the Web Project"]]), path: "https://www.spintheweb.org", target: "_blank" },
			{ name: new Map([["en", "<hr>"]]) },
			{ name: new Map(), path: "https://www.keyvisions.it", target: "_blank" },
			{ name: new Map([["en", "e"]]), path: "/e" },
		]
	}

	override render(_req: Request, _session: STWSession): string {
		let body: string = "";
		this.options.forEach(option => {
			const element = STWSite.get().find(_session, option.path || "");
			const name = option.name.get(_session.lang) || (element ? element.localize(_session, "name") : option.path);

			if (!element?.isVisible(_session) )
				body += `<li>${option.path ? `<a href="${option.path}" ${option.target ? `target="${option.target}"` : ""}>${name}</a>` : name}</li>`;
		});

		return `<nav class="stwVOrientation">${body}</nav>`;
	}
}

STWFactory.Navigation = STWNavigation;