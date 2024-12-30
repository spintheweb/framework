/**
 * Spin the Web contents @module stwContents
 * 
 * This module includes the Spin the Web contents classes based on the 
 * abstract STWContent class found in @module stwElement.ts
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession, STWContent, ISTWContent, STWFactory } from "./stwElements.ts";

export class STWText extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		return await new Response(this.layout.get(_session.lang), { status: 200 });
	}
}

export class STWForm extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		return await super.render(_req, _session, _body);
	}
}

export class STWList extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		return await super.render(_req, _session, _body);
	}
}

export class STWTable extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		return await super.render(_req, _session, _body);
	}
}

export class STWBreadcrumbs extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		return await super.render(_req, _session, _body);
	}
}

export class STWMenu extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		return await super.render(_req, _session, _body);
	}
}

export class STWLanguages extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
	override async render(_req: Request, _session: STWSession, _body: string): Promise<Response> {
		_body = `<nav>${_session.site.langs.map(lang => `<a href="/stw/language/${lang}">${lang.toUpperCase()}</a>`)}</nav>`;
		return await super.render(_req, _session, _body);
	}
}

export class STWTree extends STWContent {
	constructor(content: ISTWContent) {
		super(content);
	}
}

// Map STW constructors
STWFactory.Text = STWText;
STWFactory.Form = STWForm;
STWFactory.List = STWList;
STWFactory.Table = STWTable;
// STWFactory.Breadcrumbs = STWBreadcrumbs;
STWFactory.Menu = STWMenu;
STWFactory.Tree = STWTree
STWFactory.Languages = STWLanguages;
