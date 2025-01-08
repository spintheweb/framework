/**
 * Spin the Web Menu content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwSession.ts";
import { STWContent, ISTWContent, ISTWOption } from "../stwElements/stwContent.ts";

export class STWMenu extends STWContent {
	options!: ISTWOption[];

	constructor(content: ISTWContent) {
		super(content);
	}
	override render(_req: Request, _session: STWSession): string {
		return `Rendered ${this.constructor.name} for ${_session.user}`;
	}
}

STWFactory.Menu = STWMenu;