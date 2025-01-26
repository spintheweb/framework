/**
 * Spin the Web Tabs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWOption, ISTWContentWithOptions } from "../stwElements/stwContent.ts";

// TODO: If the permalink of an element is changed the pathname of the corresponding options needs to be updated
export class STWTabs extends STWContent {
	options: ISTWOption[] = [];

	constructor(content: ISTWContentWithOptions) {
		super(content);

		if (content.options)
			content.options.forEach((option: ISTWOption) => {
				this.options.push({ name: new Map(Object.entries(option.name || {})), ref: option.ref || "" });
			});
	}

	override render(_req: Request, session: STWSession): string {
		let body = "";
		this.options.forEach(option => {
			const element = session.site.find(session, option.ref || "");

			if (element instanceof STWContent && element.isVisible(session)) {
				const name = option.name.get(session.lang) || (element ? element.localize(session, "name") : option.ref);

				const placeholder = crypto.randomUUID();
				body += `<dt>${name}</dt><dd><article id="${placeholder}"></dd>`;
				session.socket?.send(JSON.stringify({ method: "PATCH", id: element._id, placeholder: placeholder })); // Ask client to request content
			}
		});
		return `<dl onclick="event.currentTarget.querySelectorAll('dt').forEach(dt => dt.classList[dt == event.target ? 'add' : 'remove']('stwSelected'))">${body}</dl>`;
	}
}

STWFactory.Tabs = STWTabs;