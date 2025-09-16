// SPDX-License-Identifier: MIT
// Spin the Web element: stwArea

import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { ISTWElement, STWElement } from "./stwElement.ts";
import { STWSite } from "./stwSite.ts";

export interface ISTWArea extends ISTWElement {
	mainpage: string;
	version: string;
}
export class STWArea extends STWElement {
	mainpage: string;
	version: string;

	public constructor(area: ISTWArea) {
		super(area);

		this.mainpage = area.mainpage;
		this.version = area.version || `v1.0.0 ${new Date().toISOString()}`
	}

	public override toLocalizedJSON(session: STWSession): object {
		return {
			...super.toLocalizedJSON(session),
			mainpage: this.mainpage,
			version: this.version
		};
	}

	public override update(session: STWSession, data: any): void {
		super.update(session, data);
		
		this.mainpage = data.mainpage || this.mainpage;
		this.version = data.version || this.version;
	}

	public override serve(req: Request, session: STWSession): Promise<Response> {
		const page = STWSite.index.get(this.mainpage);

		return page?.serve(req, session) ||
			new Promise<Response>(resolve => {
				const response = new Response(`Area '${this.localize(session, "name")}' main page not found`, { status: 404, statusText: "Not Found" });
				resolve(response);
			});
	}
}

STWFactory.Area = STWArea;