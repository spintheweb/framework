/**
 * Spin the Web WBLL - Webbabse Layout Language
 * 
 * Given a text layout, tokenize it (lex it), the tokenized layout is then ready to be rendered.
 * Rendering is session specific, first all placeholders are replaced then content specific renderings are applied.
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWSession } from "../stwSession.ts";

const SYNTAX: RegExp = new RegExp([
	/(\\[aAs])(?:\('([^]+?)'\))/,
	/(\\[rnt])(?:\('([^]*?)'\))?/,
	/(?:([aAbo]))(?:\('([^]*?)'\))?((<|>|p(\('[^]*?'\))?)*)/,
	/(?:([cefhilmruwxyz]))(?:\('([^]*?)'\))?/,
	/(?:([dnsvVk]))(?:\('([^]*?)'\))/,
	/(?:([jJtT]))(?:\('([^]*?)'\))/,
	/\/\/.*$/,
	/\/\*[^]*(\*\/)?/,
	/([<>]+)/, // TODO: Group consecutive moves
	/(?<error>[\S])/ // Anything else is an error
].map(r => r.source).join('|'), "gmu");

class STWToken {
	symbol: string;
	args: string[] = [];
	params: STWToken[] = []; // Only p, < and > symbols allowed
	attrs: Map<string, string> = new Map();
	text?: STWToken;

	constructor(symbol: string, args?: string[], params?: STWToken[], attrs?: Map<string, string>, text?: STWToken) {
		this.symbol = symbol;
		if (args) this.args = args;
		if (params) this.params = params;
		if (attrs) this.attrs = new Map(attrs);
		this.text = text;
	}
}

interface ISTWLayout {
	settings: Map<string, string>;
	tokens: STWToken[];
}
export class STWLayout {
	wbll: string; // Webbase Layout Language
	settings: Map<string, string> = new Map();
	tokens: STWToken[] = [];
	render: (session: STWSession) => string; // TODO: After lexing, convert layout in function

	constructor(wbll: string) {
		this.wbll = wbll;

		this.render = (_session: STWSession): string => {
			return wbll;
		};

		for (const expression of this.wbll.matchAll(SYNTAX)) {
			if (expression.groups?.error !== undefined)
				throw new SyntaxError(expression.input.slice(0, expression.index) + ' >>>' + expression.input.slice(expression.index));;

			const pattern = expression.filter((value, i) => (value !== undefined && i));

			if (pattern[0]) {
				const token = new STWToken(pattern[0]);

				if (token.symbol[0] == "\\" && "\\a\\s\\A\\t\\n".indexOf(token.symbol) != -1) {
					for (const attr of pattern[1].matchAll(/([a-zA-Z0-9-_]+)(?:=(["'])([^]*?)\2)?/gmu))
						token.attrs.set(attr[1], attr[3] || "true");
					if (token.symbol == "\\s")
						this.settings = new Map(token.attrs);
					else if (token.symbol == "\\a" && this.tokens.at(-1))
						(this.tokens.at(-1) as STWToken).attrs = token.attrs;
					else
						this.tokens.push(token);
					continue;

				} else if (pattern[1]) {
					token.args = "chrw".indexOf(token.symbol) != -1 ? [""] : []; // No format
					for (const arg of (pattern[1] + ';').matchAll(/(?:(=?(["']?)[^]*?\2));/gmu))
						token.args.push(arg[1]);
				}

				if (pattern[2]?.match("^[<>p]")) {
					for (const symbol of pattern[2].matchAll(/(<|>|p(?:\('([^]*?)'\)?)?)/gmu)) {
						if (symbol[2]) {
							const pair = [...symbol[2].matchAll(/([a-zA-Z0-9-_]*)(?:;([^]*))?/gmu)][0];

							this.tokens.at(-1)?.params.push(new STWToken("p", [pair[1], pair[2] || "@@"]));
						} else
							token.params.push(new STWToken(symbol[0][0]));
					}
				}

				if ("fitvxyz".indexOf(token.symbol) != -1 && this.tokens.at(-1) && "aA".indexOf(this.tokens.at(-1)?.symbol || "") != -1 && !this.tokens.at(-1)?.text) {
					(this.tokens.at(-1) as STWToken).text = token;
					continue;

				} else if (token.symbol == "A") {
					token.symbol = "a";
					token.attrs.set("target", "_blank");
				}

				this.tokens.push(token);
			}
		}
	}
}
/*
export function renderAttributes(req: Request, attrs: string[]) {
	let html = '';
	if (attrs)
		for (const attr in attrs)
			html += ` ${attr}="${attr === 'name' ? attrs[attr] : Deno.encode(getValue(req, attrs[attr]))}"`;
	return html;
}

function renderParameters(req: Request, uri: string, params) {
	let url;
	try {
		url = new URL(getValue(req, uri));

		url.href = rePlaceholders(url.href, req.stwPublic, req.stwPrivate.stwData[req.stwPrivate.stwR]);

		if (params)
			for (const param in params)
				url.searchParams.set(param[0] === '§' ? Object.keys(req.stwPrivate.stwData[req.stwPrivate.stwR])[req.stwPrivate.stwC] : param, getValue(req, params[param]));
		return url.href;
	} catch {
		url = new URL('https://stw.local/' + uri);
		for (const param of params) {
			if (param.symbol === 'p')
				url.searchParams.set(param.name || Object.keys(req.stwPrivate.stwData[0])[req.stwPrivate.stwC], getValue(req, param.value));
			else if (param.symbol === '>')
				++req.stwPrivate.stwC;
			else
				--req.stwPrivate.stwC;
		}
		return url.href.replace('https://stw.local/', '');
	}
}

// flags = CELL|THEAD|TABLE|RECURSE
export function renderer(req: Request, contentId: string, layout: string, flags: number = 0b0000) {
	if (typeof layout == 'string')
		return layout;

	if ((flags & 0b0001) == 0b0000) {
		req.stwPrivate.stwC = 0;
		req.stwPrivate.stwR = req.stwPrivate.stwR || 0;
	}

	if (!layout.tokens.length)
		Object.keys(req.stwPrivate.stwData[0]).forEach(i => {
			layout.tokens.push({ symbol: 'l', args: [] });
			layout.tokens.push({ symbol: 'f', args: [] });
			if ((flags & 0b0110) != 0b0110) layout.tokens.push({ symbol: '\\r', args: [] });
		});

	let html = '', thead = '', str;
	for (const token of layout.tokens)
		try {
			switch (token.symbol) {
				case '<':
					--req.stwPrivate.stwC;
					continue;
				case '>':
					req.stwPrivate.stwC++;
					continue;
				case 'a':
					str = token.args ? token.args[0] : '@@';
					html += `<a href="${renderParameters(req, str, token.params)}" ${renderAttributes(req, token.attrs)}>
						${renderer(req, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [str] }] }, 0b0001)}</a>`;
					continue;
				case 'b':
					// TODO: Table buttons?
					if (token.args)
						str = token.args[0] == '.' ? req.data.url.pathname : token.args[0];
					else
						str = '@@';
					token.params.stwHandler = contentId;
					html += `<button formaction="${renderParameters(req, str, token.params)}" ${renderAttributes(req, token.attrs)}>
						${renderer(req, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [''] }] } || str, 0b0001)}</button>`;
					continue;
				case 'c':
					token.attrs = token.attrs || {};
					token.attrs.type = 'checkbox'
					token.attrs.name = getName(req, token.args[0]);
					token.attrs.value = token.args[1] || '@@';
					for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
						html += `<label><input${renderAttributes(req, token.attrs)}>`;
					}
					continue;
				case 'd':
					token.attrs = token.attrs || {};
					token.attrs.name = getName(req, token.args[0]);
					token.attrs.value = token.args[0] || '@@';
					html += `<select${renderAttributes(req, token.attrs)}><option></option></select>`;
					continue;
				case 'h':
					token.attrs = token.attrs || {};
					token.attrs.type = 'hidden';
				// falls through 
				case 'e':
					token.attrs = token.attrs || {};
					token.attrs.name = getName(req, token.args[1]);
					token.attrs.value = token.args[1] || '@@';
					html += `<input${renderAttributes(req, token.attrs)}>`;
					continue;
				case 'f':
					str = getValue(req, '@@');
					if (!token.attrs)
						html += ' ' + str;
					else
						html += `<span${renderAttributes(req, token.attrs)}>${str}</span>`;
					continue;
				case 'i':
					str = getValue(req, token.args[0]);
					if (str)
						html += `<img src="${str}"${renderAttributes(req, token.attrs)}>`;
					continue;
				case 'j':
					html += `<script${renderAttributes(req, token.attrs)}>${token.args[2]}</script>`;
					continue;
				case 'l':
					str = getName(req, token.args[0]);
					if ((flags & 0b0010) == 0b0000) // Not table
						html += `<label${renderAttributes(req, token.attrs)}>${str}</label>`;
					else if ((flags & 0b0110) == 0b0110) // thead
						thead += `<th${renderAttributes(req, token.attrs)}>${str}</th>`;
					else // cell
						html += ((flags & 0b1000) == 0b1000 ? '</td>' : '') + `<td${renderAttributes(req, token.attrs)}>`;
					flags |= 0b1000;
					continue;
				case 'm':
					token.attrs = token.attrs || {};
					token.attrs.name = getName(req, token.args[0]);
					html += `<textarea${renderAttributes(req, token.attrs)}>${Deno.encode(getValue(req, token.args[0] || '@@'))}</textarea>`;
					continue;
				case 'n':
					continue;
				case 'o':
					token.args.forEach(child => {
						req.target.send(JSON.stringify({
							message: 'request',
							body: {
								url: renderParameters(req, 'http://stw.local' + getValue(req, child), token.params),
								section: `_${contentId}`
							}
						}));
					});
					html += `<article data-ref="_${contentId}"></article>`;
					continue;
				case 'r':
					token.attrs = token.attrs || {};
					token.attrs.type = 'radio'
					token.attrs.name = getName(req, token.args[0]);
					token.attrs.value = token.args[1] || '@@';
					for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
						html += `<label><input${renderAttributes(req, token.attrs)}>`;
					}
					continue;
				case 's':
					continue;
				case 't':
				case 'v':
				case 'T':
				case 'V':
					str = 'tv'.indexOf(token.symbol) != -1 ? token.args[2] : evaluate(req, token.args[2]);
					if (!token.attrs)
						html += str;
					else
						html += `<span${renderAttributes(req, token.attrs)}>${str}</span>`;
					continue;
				case 'u':
					continue;
				case 'x':
				case 'y':
				case 'z':
					continue;
				case '\\n': // TODO: Depends on content: tr+td or br
					html += '<br>';
					continue;
				case '\\r':
					html += '<br>';
					continue;
				case '\\t': // TODO: Depends on content: td
					continue;
			}
		} catch (err) {
			throw err;
		}
	if ((flags & 0b0110) == 0b0110)
		return thead;
	return html + ((flags & 0b1000) == 0b1000 ? '</td>' : '');
}
*/