/**
 * Spin the Web Tabs content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWOption, ISTWContentWithOptions } from "../stwElements/stwContent.ts";

export class STWTabs extends STWContent {
	options: ISTWOption[] = [];

	public constructor(content: ISTWContentWithOptions) {
		super(content);

		if (content.options)
			content.options.forEach((option: ISTWOption) => {
				this.options.push({ name: new Map(Object.entries(option.name || {})), ref: option.ref || "" });
			});
	}

	public override render(_req: Request, session: STWSession): string {
		let body = "", id = "";

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

		const placeholder = crypto.randomUUID();
		body += `<dd><article id="${placeholder}"></article></dd>`;
		session.socket?.send(JSON.stringify({ method: "PATCH", id: id, placeholder: placeholder })); // Ask client to request content

		// The STWTabs script selects the clicked tab and requests from the spinner the tab content
		return `<dl>${body}</dl>
			<script name="STWTabs" onload="fnSTWTabs('${this._id}')">
				function fnSTWTabs(id) {
					const tabs = self.document.getElementById(id);
					tabs.querySelector("dl").addEventListener("click", event => {
						const target = event.target;
						if (target.tagName === "DT" && !target.classList.contains("stwSelected")) {
							event.currentTarget.querySelectorAll('dt').forEach(dt => dt.classList[dt == target ? "add" : "remove"]("stwSelected"));
							event.currentTarget.querySelector("dd article").id = "refreshSTWTab";
							stwWS.send(JSON.stringify({ method: "PATCH", resource: target.getAttribute("data-ref"), options: { placeholder: "refreshSTWTab" } }));
						}
					});
				}
			</script>`;
	}
}

STWFactory.Tabs = STWTabs;