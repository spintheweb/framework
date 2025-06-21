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
import { tee } from "https://deno.land/std@0.104.0/async/tee.ts";
import { STWSession } from "../stwComponents/stwSession.ts";
import { wbpl } from "../stwComponents/stwUtilities.ts";

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
	private wbll: string;
	private tokens: STWToken[] = [];
	private tokenHandlers: Map<string, (token: STWToken) => string>;

	private _render?: (subtype: string, req: Request, session: STWSession, fields: string[], ph: Map<string, string>, wbpl: (text: string, ph: Map<string, string>) => string) => string;

	settings: Map<string, string> = new Map([
		["rows", "25"],
		["period", "month"]
	]);

	public constructor(wbll: string) {
		this.wbll = wbll;
		this.tokenHandlers = this.initializeHandlers();

		// The constructor is a Lexer, it checks for syntax errors and tokenizes the layout
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

	public render(subtype: string, req: Request, session: STWSession, fields: string[], ph: Map<string, string>): string {
		if (!this._render) {
			const fn: string = this.compileRenderFunction();
			this._render = new Function("subtype", "req", "session", "fields", "ph", "wbpl", fn) as (subtype: string, req: Request, session: STWSession, fields: string[], ph: Map<string, string>, wbplFn: (text: string, ph: Map<string, string>) => string) => string;
		}
		return this._render(subtype, req, session, fields, ph, wbpl);
	}

	// Token handlers are functions that take a token and return a string of JavaScript code
	// that will be executed to render the token into HTML.
	private initializeHandlers(): Map<string, (token: STWToken, inline: boolean) => string> {
		const handlers = new Map<string, (token: STWToken) => string>();

		const attributes = (token: STWToken): string =>
            [...token.attrs.entries()].map(([k, v]) => ` ${k}="\${${v}}"`).join("");

        /**
         * Generates a block of JavaScript code that will, at render time,
         * build a URL and its query string using the URL and URLSearchParams APIs.
         * @param baseUrl The base URL for the link.
         * @param params The list of parameter tokens (p).
         * @returns A string of JavaScript code.
         */
        const querystring = (baseUrl: string, params: STWToken[]): string => {
            let code = `let url = new URL(\`${baseUrl}\` || '/'), p_name, p_val;`;
            for (const param of params) {
                const nameArg = `"${param.args[0] || ''}" || fieldName`;
                const valueArg = param.args[1] ? `wbpl("${param.args[1]}", ph)` : `(ph.get("@@" + (${nameArg})) || "")`;
                code += `p_name = ${nameArg}; p_val = ${valueArg}; if (p_val) url.searchParams.set(p_name, p_val);`;
                if (!param.args[0])
                    code += `fldCursor();\n`;
            }
            code += `href = url.href + url.search;`;
            return code;
        };

        handlers.set("a", (token) => {
            token.attrs.delete("value");
            token.attrs.delete("href");

            // Get the code for the link's text content. This will be executed inside a closure.
            const innerToken = token.text || new STWToken("t", [token.args[0] || ""]);
            const textHandler = this.tokenHandlers.get(innerToken.symbol);
            const textCode = textHandler ? textHandler(innerToken) : "";

            // We generate an IIFE (Immediately Invoked Function Expression) to create a private scope
            // for building the href and text content before adding the final <a> tag to the main html string.
            return `
                let href = ""; ${querystring(token.args[0] || "", token.params)}
                const textContent = (() => { let html=""; ${textCode} return html; })();
                html += \`<a href="\${href}"${attributes(token)}>\${textContent}</a>\`;
            `;
        });

        handlers.set("b", (token) => `html += \`<button${attributes(token)}>${token.args[1]}</button>\`;`);

		const checkboxRadioHandler = (token: STWToken) => {
			token.attrs.set("name", `\${"${token.args[0] || ''}" || fieldName}`);
			token.attrs.set("checked", `\${ph.get("@@${token.args[1]}") ? "checked" : ""}`);
			return `html += \`<input${attributes(token)}>\`;${!token.args[0] ? 'fldCursor()' : ''}`;
		};
		handlers.set("c", checkboxRadioHandler);

		handlers.set("d", (token) => `html += \`<select ${attributes(token)}><option></option></select>\`;`);

		const fieldInputHandler = (token: STWToken, _recurse: boolean = false) => {
			const nameArg = token.symbol === 'e' ? token.args[1] : token.args[0];
			const valueArg = token.symbol === 'e' ? token.args[2] : token.args[1];

			token.attrs.set("name", `"${nameArg || ''}" || fieldName`);
			token.attrs.set("value", `fieldValue || wbpl("${valueArg ?? ''}", ph)`);

			return `html += \`<input${attributes(token)}>\`;${!nameArg ? 'fldCursor();' : ''}`;
		};
		handlers.set("e", fieldInputHandler);

		handlers.set("f", () => `html += fieldValue; fldCursor();`);

		handlers.set("h", fieldInputHandler);

		handlers.set("i", (token) => {
			token.attrs.delete("value");
			token.attrs.set("src", `\${"${token.args[0] || ''}" || ''}`);
			return `html += \`<img${attributes(token)}>\`;`;
		});

		handlers.set("j", (token) => `html += \`<script>${token.args[0] ?? ''}</script>\`;`);
		handlers.set("v", (token) => `html += \`${eval(token.args[0]) ?? ''}\`;`);

		handlers.set("k", (token) => `if ("${token.args[0] ?? ''}") ph.set("${token.args[0]}", "${token.args[1] ?? ''}");`);

		handlers.set("l", (token) => {
			token.attrs.delete("value");
			return `html += \`<label${attributes(token)}>\${"${token.args[0] ?? ''}" || fieldName}</label>\`;`;
		});

		handlers.set("m", (token) => {
			const nameArg = token.args[0];
			const valueArg = token.args[1];
			token.attrs.set("name", `\${"${nameArg || ''}" || fieldName}`);
			return `html += \`<textarea${attributes(token)}>\${wbpl("${valueArg ?? ''}", ph)}</textarea>\`; if ("${nameArg ?? ''}") fldCursor();`;
		});

		handlers.set("n", (token) => `html += \`${token.args[0]}\`;`);

		handlers.set("o", (token) => {
			token.attrs.set("id", crypto.randomUUID());
			token.attrs.set("href", `\${"${token.args[0]}" + "${querystring(token.params)}"}`);
			return `html += \`<article${attributes(token)}></article>\`;`;
		});

		handlers.set("r", checkboxRadioHandler);
		handlers.set("s", handlers.get("d")!);
		handlers.set("t", (token, inline = false) => inline ? token.args[0] : `html += \`${token.args[0]}\`;`);

		handlers.set("u", (token) => `html += \`<input type="file"${attributes(token)}>\`;`);

		handlers.set("w", fieldInputHandler);

		const noOpHandler = () => ``;
		handlers.set("x", noOpHandler);
		handlers.set("y", noOpHandler);
		handlers.set("z", noOpHandler);

		const brHandler = () => `html += \`<br>\`;`;
		handlers.set("\\r", brHandler);
		handlers.set("\\n", brHandler);
		handlers.set("\\t", brHandler);

		return handlers;
	}

	private compileRenderFunction(): string {
		let fn = `let html="",fld=0,df=0,fieldName=(fields[0]?.name ?? "stwFld0"),fieldValue=ph.get("@@" + fieldName) ?? "",fldCursor=(df=1)=>{fld+=df; if(fld<0) fld=0; else if (fld>=fields.length) fld=fields.length-1; fieldName=fields[fld].name ?? "stwFld"+fld; fieldValue=ph.get("@@"+fieldName) ?? "";return "";};`;

		this.tokens.forEach(token => {
			const handler = this.tokenHandlers.get(token.symbol);
			if (handler)
				fn += handler(token);
		});

		fn += "return html;";
		return fn;
	}
}
