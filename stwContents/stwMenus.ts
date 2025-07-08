/**
 * Spin the Web Menus content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContentWithOptions, ISTWOption } from "../stwElements/stwContent.ts";
import { STWElement } from "../stwElements/stwElement.ts";

export class STWMenus extends STWContent {
	options: ISTWOption[] = [];

	public constructor(content: ISTWContentWithOptions) {
		super(content);

		this.options = loadOptions(content.options || []);

		function loadOptions(options: ISTWOption[]): ISTWOption[] {
			const _options: ISTWOption[] = [];
			options.forEach((option: ISTWOption) =>
				_options.push({ name: new Map(Object.entries(option.name || {})), ref: option.ref || "", options: loadOptions(option?.options || []) })
			);
			return _options;
		}
	}

	public override toLocalizedJSON(session: STWSession): object {
		return {
			...super.toLocalizedJSON(session),
			options: this.options.map(option => ({
				...option,
				name: Object.fromEntries(option.name)
			}))
		};
	}

	public override async render(_req: Request, session: STWSession): Promise<string> {
		let body: string = "";
		this.options.forEach(option => subrender(option));
		if (this.layout.get(session.lang)?.settings.has("short"))
			return `<nav><menu><li style="width:2rem"><div><i class="fa-light fa-bars"></i></div><menu>${body}</menu></li></menu></nav>`;
		return `<nav><menu>${body}</menu></nav>`;

		function subrender(option: ISTWOption, iteration: boolean = false): void {
			const element = session.site.find(session, option.ref || "");

			let href = option.ref;
			if (element)
				href = element?.pathname(session);
			const name = option.name.get(session.lang) || (element ? element.localize(session, "name") : href);

			if (name === "-")
				body += iteration ? "<hr>" : "";
			else if (!element || element.isVisible(session)) {
				if (element instanceof STWContent)
					body += `<li><article id="${crypto.randomUUID()}" href="${element._id}${(new URL(_req.url)).search}"></article></div>`;
				else if (option.options?.length) {
					body += `<li><div>${!option.options?.length && href ? `<a href="${href}">${name}</a>` : name}<i class="fa-light fa-angle-right"></i></div>`;
					body += "<menu>", option.options.forEach(option => subrender(option, true)), body += "</menu>";
				} else
					body += `<li><div>${!option.options?.length && href ? `<a href="${href}">${name}</a>` : name}</div>`;
				body += "</li>";
			}
		}
	}
}

STWFactory.Menus = STWMenus;