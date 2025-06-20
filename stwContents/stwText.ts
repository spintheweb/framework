/**
 * Spin the Web Text content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { ISTWRecords, STWDatasources } from "../stwDatasources.ts";
import { wbpl } from "../stwUtilities.ts";

export class STWText extends STWContent {
	public constructor(content: ISTWContent) {
		super(content);
	}

	public override async serve(req: Request, session: STWSession, ref: STWContent | undefined): Promise<Response> {
		if (!ref && !this.isVisible(session))
			return new Promise<Response>(resolve => resolve(new Response(null, { status: 204 }))); // 204 No content

		if (ref)
			console.debug(`${new Date().toISOString()}: ${ref._id === this._id ? " ●" : "│└"} Text (${this.pathname(session)}) @${this.section}.${this.sequence} [${this._id}]`);
		else
			console.debug(`${new Date().toISOString()}: ├─ Text (${this.pathname(session)}) @${this.section}.${this.sequence} [${this._id}]`);

		const data = {
			method: "PUT",
			id: this._id,
			section: (ref || this).section,
			sequence: (ref || this).sequence,
			body: this.render(req, session, await STWDatasources.query(session, this))
		};
		return new Promise<Response>(resolve => resolve(new Response(JSON.stringify(data))));
	}

	public override render(_req: Request, session: STWSession, records: ISTWRecords): string {
		const layoutValue = this.layout?.get(session.lang);
		const layoutText = typeof layoutValue === "string" ? layoutValue : (layoutValue?.toString?.() ?? "");
		if (records?.rows?.length) {
			return records.rows.map(row => {
				const merged = { ...Object.fromEntries(session.placeholders), ...row };
				return wbpl(layoutText, merged);
			}).join("");
		}
		return wbpl(layoutText, new Map(session.placeholders));
	}
}

STWFactory.Text = STWText;