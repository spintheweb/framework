/**
 * Spin the Web Tabs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSite } from "../stwElements/stwSite.ts";
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWOption, ISTWContentWithOptions } from "../stwElements/stwContent.ts";
import { ExecuteResult } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

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

	override render(_req: Request, _session: STWSession): string {
		let body = "";
		this.options.forEach(option => {
			const element = STWSite.get().find(_session, option.ref || "");

			if (element instanceof STWContent && element.isVisible(_session)) {
				const name = option.name.get(_session.lang) || (element ? element.localize(_session, "name") : option.ref);
				body += `<dt>${name}</dt><dd>${element.render(_req, _session, [] as ExecuteResult)}</dd>`;
			}
		});
		return `<dl onclick="event.currentTarget.querySelectorAll('dt').forEach(dt => dt.classList[dt == event.target ? 'add' : 'remove']('stwSelected'))">${body}</dl>`;
	}
}

STWFactory.Tabs = STWTabs;