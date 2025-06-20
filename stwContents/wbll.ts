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
import { wbpl } from "../stwUtilities.ts";

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

	public constructor(symbol: string, args?: string[], params?: STWToken[], attrs?: Map<string, string>, text?: STWToken) {
		this.symbol = symbol;
		if (args) this.args = args; // a('http://fufi'), b(';Click;...')
		if (params) this.params = params; // p che seguono una a, b o o
		if (attrs) this.attrs = new Map(attrs); // \a('class="greeting"')
		this.text = text; // a('foo')pppf\a('onclick="doSomething()"'), o('123')pp\a('class="article"')
	}
}

/**
 *  @param wbll
 *  @param settings
 *  @param render
 */
export class STWLayout {
	private wbll: string; // Webbase Layout Language
	private tokens: STWToken[] = []; // Tokenized layout
	private _render?: (subtype: string, req: Request, session: STWSession, fields: string[], placeholders: Map<string, string>, wbpl: (text: string, placeholders: Map<string, string>) => string) => string;

	// Default settings for the layout, these can be overridden by the \s token
	settings: Map<string, string> = new Map([
		["rows", "25"],
		["period", "month"]
	]);

	// The constructor is a Lexer, it checks for syntax errors and tokenizes the layout
	public constructor(wbll: string) {
		this.wbll = wbll;

		for (const expression of this.wbll.matchAll(SYNTAX)) {
			if (expression.groups?.error !== undefined)
				throw new SyntaxError(expression.input.slice(0, expression.index) + ' ⋙' + expression.input.slice(expression.index));;

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
					token.args = "chrw".indexOf(token.symbol) != -1 ? [""] : []; // No format argument
					for (const arg of (pattern[1] + ';').matchAll(/(?:(=?(["']?)[^]*?\2));/gmu))
						token.args.push(arg[1]);
					token.attrs.set("type", ["hidden", "checkbox", "radiobox", "password", ""].at("hcrw".indexOf(token.symbol)) || "");
					if (token.attrs.get("type") === "")
						token.attrs.delete("type");
					if ("eE".indexOf(token.symbol) != -1)
						token.attrs.set("name", token.args[1] || "@@");
					else if ("cdDhmMrsSu".indexOf(token.symbol) != -1)
						token.attrs.set("name", token.args[0] || "@@");
					token.attrs.set("value", token.args[2] || "@@");
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

	public render(subtype: string, req: Request, session: STWSession, fields: string[], placeholders: Map<string, string>): string {
		// Compile Layout on first use, this has a couple of advantages: Faster rendering and reduced memory usage.
		if (!this._render) {
			const fn: string = this.compileRenderFunction();
			this._render = new Function("subtype", "req", "session", "fields", "placeholders", "wbpl", fn) as (subtype: string, req: Request, session: STWSession, fields: string[], placeholders: Map<string, string>, wbplFn: (text: string, placeholders: Map<string, string>) => string) => string;
		}
		return this._render(subtype, req, session, fields, placeholders, wbpl);
	}

	private compileRenderFunction(): string {
		let fn = `let html="",field=0,df=0,fieldName,fieldValue;\n`;

		let field = 0; // Field index, used to generate unique fieldNames for fields
		this.tokens.forEach(token => {
			fn +=
				'if (fields[field]?.name) { fieldName = fields[field]?.name; df = 1; } else { fieldName = "stwFld"+field; }' +
				`if (fieldName) { fieldValue = placeholders.get("@@" + fieldName); } else { fieldName = ""; }\n`;

			if (token.symbol === "a") {
				token.attrs.set("href", `${token.args[0]}${querystring(token.params) || ""}`);
				fn += `html += '<a${attributes(token)}>${token.text}</a>';\n`;

			} else if (token.symbol === "b") {
				fn += `html += \`<button${attributes(token)}>${token.args[1]}</button>\`;\n`; // Content sensitive

			} else if ("cr".indexOf(token.symbol) != -1) {
				token.attrs.set("name", token.attrs.get("name") || token.args[0] || `fld${++field}`);
				token.attrs.set("checked", `@@${token.args[1] || "checked"}`);
				fn += `html += \`<input${attributes(token)}>\`;\n`; // Content sensitive

			} else if ("ds".indexOf(token.symbol) != -1) {
				fn += `html += \`<select ${attributes(token)}><option></option></select>\`;\n`; // Content sensitive

			} else if ("e".indexOf(token.symbol) != -1) {
				token.attrs.set("name", "' + (\"" + (token.args[1] ? token.args[1] : "") + "\" || fieldName) + '");
				token.attrs.set("value", `' + (fieldValue || wbpl("${token.args[2] ? token.args[2] : ""}", placeholders)) + '`);
				fn += `html += '<input${attributes(token)}>';`; // Content sensitive
				fn += 'field += df; df = 0;'; // Increment field index only if the field is used

			} else if (token.symbol === "l") {
				fn += `html += '<label${attributes(token)}>' + ("` + (token.args[0] ? token.args[0] : "") + `" || fieldName) + '</label>';\n`;

			} else if ("hw".indexOf(token.symbol) != -1) {
				token.attrs.set("name", "' + (\"" + (token.args[0] ? token.args[0] : "") + "\" || fieldName) + '");
				token.attrs.set("value", `' + (fieldValue || wbpl("${token.args[1] ? token.args[1] : ""}", placeholders)) + '`);
				fn += `html += '<input${attributes(token)}>';\n`; // Content sensitive

			} else if (token.symbol === "f")
				fn += `html += fieldValue;++df;\n`;

			else if (token.symbol === "i")
				fn += `html += \`<img${attributes(token)}>\`;\n`;

			else if (token.symbol === "j")
				fn += `html += \`<script>${token.args[0]}</script>\`;\n`;

			else if (token.symbol === "k")
				fn += `placeholders.set("${token.args[0]}", "${token.args[1]}");\n`;

			else if (token.symbol === "m") {
				token.attrs.set("name", token.attrs.get("name") || token.args[0] || `fld${++field}`);
				fn += `html += \`<textarea${attributes(token)}">${token.args[1]}</textarea>\`;\n`; // Content sensitive

			} else if (token.symbol === "n") // Like text
				fn += `html += \`${token.args[0]}\`;\n`;

			else if (token.symbol === "o") {
				token.attrs.set("id", crypto.randomUUID());
				token.attrs.set("href", token.args[0] + querystring(token.params));
				fn += `html += \`<article${attributes(token)}></article>\`;\n`;

			} else if ("xyz".indexOf(token.symbol) != -1)
				fn += "";

			else if (token.symbol === "v")
				fn += `html += \`${eval(token.args[0])}\`;\n`;

			else if (token.symbol === "t")
				fn += `html += \`${token.args[0]}\`;\n`;

			else if (token.symbol === "\\r")
				fn += "html += \`<br>\`;";

			else if (token.symbol === "\\n") // Content type sensitive
				fn += "html += \`<br>\`;";

			else if (token.symbol === "\\t") // Content type sensitive
				fn += "html += \`<br>\`;";

			else if (token.symbol === "u")
				fn += `html += \`<input type="file" ${attributes(token)}>\`;\n`;

			fn += `field+=df;df=0;\n`;
		});
		fn += "return html;";

		return fn;

		function attributes(token: STWToken): string {
			return token.attrs.entries().reduce((attrs, attr) => attrs + (attr[1] === "@@" ? "" : ` ${attr[0]}="${attr[1]}"`), "");

			// return token.attrs.entries().reduce((attrs, attr) => attrs + ` ${attr[0]}="${attr[1]}"`, "");
		}
		function querystring(params: STWToken[]): string {
			const search = new URLSearchParams();
			for (const param of params)
				if (param.args[0] && param.args[1])
					search.append(param.args[0], param.args[1]);
			return search.toString();
		}
	}
}
