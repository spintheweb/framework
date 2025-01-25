/**
 * Spin the Web Menus content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSite } from "../stwElements/stwSite.ts";
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContentWithOptions, ISTWOption } from "../stwElements/stwContent.ts";

// TODO: If the permalink of an element is changed the pathname of the corresponding options needs to be updated
export class STWMenus extends STWContent {
	options: ISTWOption[] = [];

	constructor(content: ISTWContentWithOptions) {
		super(content);

		this.options = [
			{
				name: new Map([["en", "Animals"]]), ref: "/home", options: [
					{ name: new Map([["en", "Dogs"]]), ref: "/home" },
					{ name: new Map([["en", "Cats"]]), ref: "/home" },
					{
						name: new Map([["en", "Bears"]]), ref: "/home", options: [
							{ name: new Map([["en", "Dogs"]]), ref: "/home" },
							{ name: new Map([["en", "Cats"]]), ref: "/home" },
							{ name: new Map([["en", "Bears"]]), ref: "/home" },
							{ name: new Map([["en", "-"]]) },
							{ name: new Map([["en", "Orcas"]]), ref: "/home" },
							{ name: new Map([["en", "Whales"]]), ref: "/home" },
						]
					},
					{ name: new Map([["en", "Orcas"]]), ref: "/home" },
					{ name: new Map([["en", "Whales"]]), ref: "/home" },
				]
			},
			{ name: new Map(), ref: "/profile/area/page" },
			{ name: new Map([["en", "Spin the Web Project"]]), ref: "https://www.spintheweb.org", target: "_blank" },
			{ name: new Map([["en", "-"]]) },
			{ name: new Map(), ref: "https://www.keyvisions.it", target: "_blank" },
			{ name: new Map([["en", "e"]]), ref: "/e" },
		]
	}

	override render(_req: Request, _session: STWSession): string {
		let body: string = "";
		this.options.forEach(option => subrender(option));
		if (this.layout.get(_session.lang)?.settings.has("short"))
			return `<nav><menu><li><div style="font-size:x-large">≣</div><menu>${body}</menu></li></menu></nav>`;	
		return `<nav><menu>${body}</menu></nav>`;

		function subrender(option: ISTWOption, iteration: boolean = false): void {
			const element = STWSite.get().find(_session, option.ref || "");
			const name = option.name.get(_session.lang) || (element ? element.localize(_session, "name") : option.ref);

			if (name === "-")
				body += iteration ? "<hr>" : "";
			else if (!element || element.isVisible(_session)) {
				body += `<li><div>${option.ref ? `<a href="${option.ref}" ${option.target ? `target="${option.target}"` : ""}>${name}</a>` : name}</div>`;
				if (option.options) {
					body += "<menu>", option.options.forEach(option => subrender(option, true)), body += "</menu>";
				}
				body += "</li>";
			}
		}
	}

}

STWFactory.Menus = STWMenus;