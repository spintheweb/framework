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
		super(content, { orientation: "horizontal" });

		if (content.options)
			content.options.forEach((option: ISTWOption) => {
				this.options.push({ name: new Map(Object.entries(option.name || {})), ref: option.ref || "" });
			});
	}

	public override render(_req: Request, session: STWSession): string {
		const layout = this.layout.get(session.lang) as STWLayout;

		let body = "<div>", id = "";

		this.options.forEach(option => {
			const element = session.site.find(session, option.ref || "");
			if (element instanceof STWContent && element.isVisible(session)) {
				const name = option.name.get(session.lang) || (element ? element.localize(session, "name") : option.ref);
				body += `<dt data-ref="${element._id}"${id ? "" : ' class="stwSelected"'}>${name}</dt>`;
				id = id || element._id;
			}
		});

		if (!id)
			return "";

		body += `</div><dd><article id="${crypto.randomUUID()}" href="${id}${(new URL(_req.url)).search}"></article></dd>`;

		// The STWTabs script selects the clicked tab and requests from the spinner the tab content
		return `<dl class="stw${layout.settings.get("orientation")[0].toUpperCase()}Tabs">${body}</dl>
			<script name="STWTabs" onload="fnSTWTabs('${this._id}')">
				function fnSTWTabs(id) {
					const tabs = self.document.getElementById(id);
					tabs.querySelector("dl").addEventListener("click", event => {
						const target = event.target.closest("dt");
						if (target && !target.classList.contains("stwSelected")) {
							event.currentTarget.querySelector("dt.stwSelected")?.classList.remove("stwSelected");
							target.classList.add("stwSelected");
							target.parentElement.classList.remove("stwSelectedBorder");
							event.currentTarget.querySelector("dd article").id = "refreshSTWTab";
							stwWS.send(JSON.stringify({ method: "PATCH", resource: target.getAttribute("data-ref"), options: { placeholder: "refreshSTWTab" } }));
						} else if (target && target.classList.contains("stwSelected")) {
							target.classList.remove("stwSelected");
							target.parentElement.classList.add("stwSelectedBorder");
							event.currentTarget.querySelector("dd article").style.display = "none";
						}
					});
				}
			</script>`;
	}
}

STWFactory.Tabs = STWTabs;