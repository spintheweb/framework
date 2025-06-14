/**
 * Spin the Web Tree content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords } from "../stwDatasources.ts";

export class STWTree extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override render(req: Request, session: STWSession, records: ISTWRecords): string {
		const layout = this.layout.get(session.lang);

		const renderNode = (node: any, depth: number = 0): string => {
			const placeholders = new Map(session.placeholders);
			Object.entries(node).forEach(([key, value]) => placeholders.set(`@@${key}`, String(value))); // Merge record and session placeholders

			const hasChildren = node.children?.length > 0;
			const toggle = `<span style="display:inline-block;width:${depth}rem"></span>${hasChildren ? `<i class="fa-solid fa-angle-down" style="width:1rem"></i>` : ""}`;
			const children = hasChildren ? `<ul>${node.children.map((child: any) => renderNode(child, depth + 1)).join("")}</ul>` : "";

			return `<li><div>${toggle} ${layout?.render(req, session, records, placeholders)}</div>${children}</li>`;
		};

		let body = "";
		if (records.rows?.length)
			body = `<ul>${renderNode(records.rows[0])}</ul>
			<script name="STWTree" onload="fnSTWTree('${this._id}')">
				function fnSTWTree(id) {
					self.document.getElementById(id).addEventListener("click", event => {
						const li = event.target.closest("li"), i = li.querySelector("i");
						event.currentTarget.querySelector("div.stwSelected")?.classList.remove("stwSelected");
						li.firstElementChild?.classList.add("stwSelected");
						if (i) {
							event.preventDefault();
							li.querySelector("ul").style.display = i.classList.contains("fa-angle-down") ? "none" : "block";
							i.classList.toggle("fa-angle-down");
							i.classList.toggle("fa-angle-right");
						}
					});
				}
			</script>`;
		return body
	}

	private renderRecord(_req: Request, _session: STWSession, _records: ISTWRecords): string {
		return "";
	}
}

STWFactory.Tree = STWTree;