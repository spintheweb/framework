/**
 * Spin the Web Menus content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
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
				_options.push({ name: new Map(Object.entries(option.name || {})), ref: option.ref || "", target: option.target, options: loadOptions(option?.options || []) })
			);
			return _options;
		}
	}

	public override render(_req: Request, session: STWSession): string {
		let body: string = "";
		this.options.forEach(option => subrender(option));
		if (this.layout.get(session.lang)?.settings.has("short"))
			return `<nav><menu><li><div style="font-size:x-large">≣</div><menu>${body}</menu></li></menu></nav>`;
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
				if (element instanceof STWContent) {
					const placeholder = crypto.randomUUID();
					body += `<li><article id="${placeholder}"></article></div>`;
					session.socket?.send(JSON.stringify({ method: "PATCH", id: element._id, placeholder: placeholder })); // Ask client to request content

				} else if (element instanceof STWElement)
					body += `<li><div><a href="${href}" ${option.target ? `target="${option.target}"` : ""}>${name}</a></div>`;

				else {
					body += `<li><div>${!option.options?.length && href ? `<a href="${href}" ${option.target ? `target="${option.target}"` : ""}>${name}</a>` : name}</div>`;
					if (option.options?.length)
						body += "<menu>", option.options.forEach(option => subrender(option, true)), body += "</menu>";
				}
				body += "</li>";
			}
		}
	}
}

STWFactory.Menus = STWMenus;