/**
 * Spin the Web Tabs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWOption, ISTWContentWithOptions } from "../stwElements/stwContent.ts";
import { STWLayout } from "./wbll.ts";

export class STWTabs extends STWContent {
	options: ISTWOption[] = [];

	public constructor(content: ISTWContentWithOptions) {
		super(content, { mode: "horizontal" });

		if (content.options)
			content.options.forEach((option: ISTWOption) => {
				this.options.push({ name: new Map(Object.entries(option.name || {})), ref: option.ref || "" });
			});
	}

	// deno-lint-ignore require-await
	public override async render(_req: Request, session: STWSession): Promise<string> {
		const layout = this.layout.get(session.lang) as STWLayout;

		let body = "<div>", id = "";
		this.options.forEach(option => {
			if (option.name.get(session.lang) === "-")
				body += `<dt style="flex-grow: 1;"></dt>`;
			else {
				const element = session.site.find(session, option.ref || "");
				if (element instanceof STWContent && element.isVisible(session)) {
					const name = option.name.get(session.lang) || (element ? element.localize(session, "name") : option.ref);
					body += `<dt data-ref="${element._id}"${id ? "" : " class=\"stwSelected\""}>${name}</dt>`;
					id = id || element._id;
				}
			}
		});

		if (!id)
			return "";

		body += `</div><dd><article id="${crypto.randomUUID()}" href="${id}${(new URL(_req.url)).search}"></article></dd>`;

		// The STWTabs script selects the clicked tab and requests from the spinner the tab content
		const mode = layout.settings.get("mode") || "horizontal";
		return `<dl class="stw${mode[0].toUpperCase()}Tabs">${body}</dl>
			<script name="STWTabs" onload="fnSTWTabs('${this._id}')">
				function fnSTWTabs(id) {
					const tabs = self.document.getElementById(id);
					tabs.querySelector("dl").addEventListener("click", event => {
						event.stopImmediatePropagation();
						const target = event.target.closest("dt");
						if (target) {
							event.currentTarget.querySelector("dd").innerHTML = '<article id="refreshSTWTab"></article>';
							if (target.classList.contains("stwSelected"))
								target.classList.remove("stwSelected");
							else {
								event.currentTarget.querySelector("dt.stwSelected")?.classList.remove("stwSelected");
								target.classList.add("stwSelected");
								stwWS.send(JSON.stringify({ method: "PATCH", resource: target.getAttribute("data-ref"), options: { placeholder: "refreshSTWTab" } }));
							}
						}
					});
				}
			</script>`;
	}
}

STWFactory.Tabs = STWTabs;