// SPDX-License-Identifier: MIT
// Spin the Web module: stwWBLL2.ts (next-gen WBLL with JS-like args)

import { STWSession } from "./stwSession.ts";
import { wbpl } from "./stwWBPL.ts";

// Parse a comma-separated WBLL argument list where each arg may be unquoted or quoted with ', " or `.
function parseWBLL2Args(input?: string): string[] {
    if (input === undefined) return [];
    const out: string[] = [];
    let cur = "";
    let q: string | null = null;
    let esc = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (esc) { cur += ch; esc = false; continue; }
        if (q) {
            if (ch === "\\") { esc = true; continue; }
            if (ch === q) { q = null; continue; }
            cur += ch; continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") { q = ch; continue; }
        if (ch === ",") { out.push(cur.trim()); cur = ""; continue; }
        cur += ch;
    }
    out.push(cur.trim());
    return out.map((s) => {
        if (s.length >= 2 && ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("`") && s.endsWith("`"))))
            return s.slice(1, -1);
        return s;
    });
}

const SYNTAX2: RegExp = new RegExp(
    [
        /(\\s)\(([^)]*?)\)/, // \\s requires one argument (parentheses required)
        /(\\[aA])(?:\(([^)]*?)\))?/, // \\a or \\A with optional argument
        /(\\[rnt])(?:\(([^)]*?)\))?/, // \\r, \\n, \\t optional args
    /(?:([aAbo]))(?:\(([^)]*?)\))?((?:\s*(?:<|>|p(?:\(([^)]*?)\))?))*)/, // a A b o with chain, allow whitespace
        /(?:([cefhilLmruwxyz]))(?:\(([^)]*?)\))?/, // other tokens optional args
        /(?:([dDnsSvVk]))(?:\(([^)]*?)\))?/, // tokens requiring args (legacy behavior kept)
        /(?:([jJtT])\(([^)]*?)\))/, // j/t require one argument (parentheses required)
        /\/\/.*$/,
        /\/\*[^]*(\*\/)?/,
        /([<>])/,
        /(?<error>[\S])/,
    ].map((r) => r.source).join("|"),
    "gmu",
);

export enum ACTIONS2 {
    stwnone = 0,
    stwinsert = 1,
    stwupdate = 2,
    stwdelete = 4,
    stwsearch = 8,
    stwfilter = 16,
    stwsubmit = 32,
    stwlogon = 64,
    stwlogoff = 128,
    stwpwdreset = 256,
    stwany = ~0,
}

class STWToken2 {
    symbol: string;
    args: string[] = [];
    params: STWToken2[] = [];
    attrs: Map<string, string> = new Map();
    text?: STWToken2;
    constructor(symbol: string, args?: string[], params?: STWToken2[], attrs?: Map<string, string>, text?: STWToken2) {
        this.symbol = symbol;
        if (args) this.args = args;
        if (params) this.params = params;
        if (attrs) this.attrs = new Map(attrs);
        this.text = text;
    }
}

export class STWLayout2 {
    private _wbll: string;
    private tokens: STWToken2[] = [];
    public groupAttributes: string = "";
    public blockAttributes: string = "";
    private _acts: ACTIONS2 = ACTIONS2.stwnone;
    private static tokenHandlers: Map<string, (token: STWToken2, inline: boolean) => string>;

    private _render?: (
        req: Request,
        session: STWSession,
        fields: string[],
        ph: Map<string, string>,
        wbpl: (text: string, ph: Map<string, string>) => string,
    ) => string;

    settings: Map<string, string> = new Map([
        ["rows", "25"],
        ["mode", "month"],
        ["disabled", "false"],
    ]);

    constructor(wbll: string) {
        if (!STWLayout2.tokenHandlers) {
            STWLayout2.tokenHandlers = this.initializeHandlers();
        }
        this._wbll = wbll;
        this._lex();
    }

    public handleAction(action: string): string[] | undefined {
        return this.tokens.find((t) => t.symbol === "b" && (t.args[1] + t.args[2]) === action)?.args;
    }

    private _lex(): void {
        this.tokens = [];
        this._render = undefined;

        for (const expression of this._wbll.matchAll(SYNTAX2)) {
            if (expression.groups?.error !== undefined) {
                throw new SyntaxError(expression.input.slice(0, expression.index) + " ⋙" + expression.input.slice(expression.index));
            }
            const pattern = expression.filter((value, i) => (value !== undefined && i));
            if (!pattern[0]) continue;

            const token = new STWToken2(pattern[0]);

            if (token.symbol[0] === "\\" && "aAsrnt".includes(token.symbol[1])) {
                // Backslash directives
                if (token.symbol === "\\s") {
                    // require one argument
                    const args = parseWBLL2Args(pattern[1] || "");
                    const attributesString = args.join(" ");
                    const attrRegex = /(@?@?@?[a-zA-Z0-9-_]+)(?:=(["'`])([^]*?)\2)?/gmu;
                    let lastIndex = 0;
                    const attributesStringStartIndex = expression.index + (expression[1]?.length || 0) + 2;
                    for (const attr of attributesString.matchAll(attrRegex)) {
                        const leadingSpace = attributesString.substring(lastIndex, attr.index);
                        if (leadingSpace.trim() !== "") {
                            const errorIndex = attributesStringStartIndex + lastIndex + leadingSpace.indexOf(leadingSpace.trim());
                            throw new SyntaxError(this._wbll.slice(0, errorIndex) + " ⋙" + this._wbll.slice(errorIndex));
                        }
                        const value = attr[3] || "true";
                        token.attrs.set(attr[1], value);
                        lastIndex = attr.index + attr[0].length;
                    }
                    for (const [k, v] of token.attrs) this.settings.set(k, v);
                    continue;
                }

                if ("rnt".includes(token.symbol[1])) { this.tokens.push(token); continue; }

                const args = parseWBLL2Args(pattern[1] || "");
                const attributesString = (args.length ? args.join(" ") : 'value="@@"');
                const attrRegex = /(@?@?@?[a-zA-Z0-9-_]+)(?:=(["'`])([^]*?)\2)?/gmu;
                let lastIndex = 0;
                const attributesStringStartIndex = expression.index + (expression[1]?.length || 0) + 2;
                for (const attr of attributesString.matchAll(attrRegex)) {
                    const leadingSpace = attributesString.substring(lastIndex, attr.index);
                    if (leadingSpace.trim() !== "") {
                        const errorIndex = attributesStringStartIndex + lastIndex + leadingSpace.indexOf(leadingSpace.trim());
                        throw new SyntaxError(this._wbll.slice(0, errorIndex) + " ⋙" + this._wbll.slice(errorIndex));
                    }
                    let value = attr[3] || "true";
                    if (token.symbol === "\\a") {
                        value = `wbpl(\`${value.replace(/`/g, "\\`")}\`, ph)`;
                    }
                    token.attrs.set(attr[1], value);
                    lastIndex = attr.index + attr[0].length;
                }
                // trailing garbage check is lenient in WBLL2; ignore
                if (token.symbol === "\\A") {
                    this.groupAttributes = attributesString || "";
                } else if (token.symbol === "\\a") {
                    const lastLogical = [...this.tokens].reverse().find((t) => !["<", ">"].includes(t.symbol));
                    if (lastLogical) for (const [k, v] of token.attrs) lastLogical.attrs.set(k, v);
                    else this.blockAttributes = attributesString || "";
                } else {
                    this.tokens.push(token);
                }
                continue;
            }

            // General tokens (all symbols accept arg list, some ignore it)
            const rawArgs = parseWBLL2Args(pattern[1] || "");
            // For compatibility with legacy expectations: some controls reserve arg[0]
            if ("chrw".includes(token.symbol)) token.args = ["", ...rawArgs];
            else token.args = rawArgs;

            const type = ["hidden", "checkbox", "radio", "password", ""].at("hcrw".indexOf(token.symbol));
            if (type) token.attrs.set("type", `'${type}'`);
            if ("eEchrw".includes(token.symbol)) token.attrs.set("name", `'${token.args[1] || "@@"}'`);
            else if ("dDmMsSu".includes(token.symbol)) token.attrs.set("name", `'${token.args[0] || "@@"}'`);
            token.attrs.set("value", `'${token.args[2] || "@@"}'`);

            // Trailing chain processing for a, A, b, o
            if ((token.symbol === "a" || token.symbol === "A" || token.symbol === "b" || token.symbol === "o") && (pattern[2] && pattern[2].trim())) {
                // Also support the (discouraged) case where chain items are mistakenly placed inside the args parentheses
                if (/^[\s<>p]/.test((pattern[1] || "").trim())) { pattern[2] = pattern[1]; token.args[0] = ""; }
                for (const sym of (pattern[2] || "").matchAll(/\s*(<|>|p(?:\(([^)]*?)\))?)/gmu)) {
                    if (sym[2]) {
                        const pParts = parseWBLL2Args(sym[2]);
                        const pName = pParts[0] ?? "";
                        const pVal = pParts[1] ?? "@@";
                        token.params.push(new STWToken2("p", [pName, pVal]));
                    } else {
                        token.params.push(new STWToken2(sym[0][0]));
                    }
                }
            }

            // Attach text token to preceding a/b when present
            if ("fitvxyz".includes(token.symbol) && this.tokens.at(-1) && "aA".includes(this.tokens.at(-1)!.symbol) && !this.tokens.at(-1)!.text) {
                this.tokens.at(-1)!.text = token;
                continue;
            } else if (token.symbol === "t" && this.tokens.at(-1)?.symbol === "b" && !this.tokens.at(-1)?.text) {
                this.tokens.at(-1)!.text = token;
                continue;
            } else if (token.symbol === "A") {
                token.symbol = "a"; token.attrs.set("target", "_blank");
            }

            this.tokens.push(token);
        }

        // Compute actions
        this._acts = ACTIONS2.stwnone;
        this.tokens.forEach((t) => {
            if (t.symbol === "b" && t.args[1] === "stw") {
                switch (t.args[2]) {
                    case "search": this._acts |= ACTIONS2.stwsearch; break;
                    case "filter": this._acts |= ACTIONS2.stwfilter; break;
                    case "insert": this._acts |= ACTIONS2.stwinsert; break;
                    case "update": this._acts |= ACTIONS2.stwupdate; break;
                    case "delete": this._acts |= ACTIONS2.stwdelete; break;
                    case "submit": this._acts |= ACTIONS2.stwsubmit; break;
                    case "logon": this._acts |= ACTIONS2.stwlogon; break;
                    case "logoff": this._acts |= ACTIONS2.stwlogoff; break;
                    case "pwdreset": this._acts |= ACTIONS2.stwpwdreset; break;
                }
            }
        });
    }

    public acts(modes: ACTIONS2): boolean { return (this._acts & modes) !== 0; }
    public get hasTokens(): boolean { return this.tokens.length > 0; }
    public get wbll(): string { return this._wbll; }
    public set wbll(value: string) { this._wbll = value; this._lex(); }

    public render(
        req: Request,
        session: STWSession,
        fields: string[],
        ph: Map<string, string>,
        isInteractive: boolean = false,
    ): string {
        for (const [key, value] of ph.entries()) { if (value === "null" || value === "undefined") ph.set(key, ""); }
        if (!this._render) {
            const fn: string = this.compileRenderFunction(isInteractive);
            this._render = new Function("req", "session", "fields", "ph", "wbpl", fn) as unknown as (
                req: Request,
                session: STWSession,
                fields: string[],
                ph: Map<string, string>,
                wbplFn: (text: string, ph: Map<string, string>) => string,
            ) => string;
        }
        return this._render(req, session, fields, ph, wbpl);
    }

    // Handlers copied/adapted from WBLL v1
    private initializeHandlers(): Map<string, (token: STWToken2, inline: boolean) => string> {
        const handlers = new Map<string, (token: STWToken2) => string>();

        const attributes = (token: STWToken2, inline: boolean = false): string =>
            [...token.attrs.entries()].map(([k, v]) => {
                if (k.startsWith("@")) {
                    return ` \${(ph.get("${k}") || "")}`;
                }
                if (v.startsWith("${") && v.endsWith("}") || inline) {
                    return ` ${k}="${v}"`;
                }
                if (v === "") {
                    return ` ${k}`;
                }
                return ` ${k}="\${${v}}"`;
            }).join("");

        /**
         * Generates a block of JavaScript code that will, at render time,
         * build a URL and its query string using the URL and URLSearchParams APIs.
         * @param baseUrl The base URL for the link.
         * @param params The list of parameter tokens (p).
         * @returns A string of JavaScript code.
         */
        const querystring = (baseUrl: string, params: STWToken2[]): string => {
            let code =
                `let base = typeof window === 'undefined' ? (origin.url || 'http://localhost') : location.href; let url = new URL(\`${baseUrl}\` || '/', base), p_name, p_val;`;
            for (const param of params) {
                const nameArg = `"${param.args[0] || ""}" || fieldName`;
                const valueArg = param.args[1] ? `wbpl("${param.args[1]}", ph)` : `(ph.get("@@" + (${nameArg})) || "")`;
                code += `p_name = ${nameArg}; p_val = ${valueArg}; if (p_val) url.searchParams.set(p_name, p_val);`;
                if (!param.args[0]) {
                    code += `fldCursor();\n`;
                }
            }
            code += `href = url.href;`;
            return code;
        };

        handlers.set("a", (token) => {
            token.attrs.delete("value");
            token.attrs.delete("href");

            const innerToken = token.text || new STWToken2("t", [token.args[0] || ""]);
            const textHandler = STWLayout2.tokenHandlers.get(innerToken.symbol);
            const textCode = textHandler ? textHandler(innerToken, false) : "";

            const baseUrl = token.args[0] || "";

            return `{
                let href = "";
                let baseUrl = wbpl(\`${baseUrl.replace(/`/g, "\\`")}\`, ph);
                if (baseUrl === "") {
                    baseUrl = ph.get("@@" + fieldName) || "";
                    fldCursor();
                }
                const hasProtocol = /^[a-z]+:\/\//i.test(baseUrl);
                const queryParams = new URLSearchParams();
                let p_name, p_val;
                ${
                token.params.map((param) => {
                    if (param.symbol === "p") {
                        const nameArg = `"${param.args[0] || ""}" || fieldName`;
                        const valueArg = param.args[1]
                            ? `wbpl(\`${(param.args[1] || "").replace(/`/g, "\\`")}\`, ph)`
                            : `(ph.get("@@" + (${nameArg})) || "")`;
                        return `p_name = ${nameArg}; p_val = ${valueArg}; if (p_val) queryParams.set(p_name, p_val); fldCursor();`;
                    } else if (param.symbol === "<") {
                        return `fldCursor(-1);`;
                    } else if (param.symbol === ">") {
                        return `fldCursor();`;
                    }
                    return "";
                }).join("\n")
            }
                const queryString = queryParams.toString();
                const base = 'http://localhost';
                const url = hasProtocol ? new URL(baseUrl) : new URL(baseUrl || '/', base);
                queryParams.forEach((value, key) => url.searchParams.set(key, value));
                href = url.href;
                const textContent = (() => { let html=""; ${textCode} return html; })();
                html+=\` <a href="\${href}"${attributes(token)}>\${textContent.trim()}</a>\`;
            }`;
        });

        handlers.set("b", (token) => {
            const value = (token.args[1] + token.args[2]) || "";
            token.attrs.set("name", "stwAction");
            token.attrs.set("type", value === "" ? "button" : value === "stwreset" ? "reset" : "submit");
            if (value) token.attrs.set("value", value);
            else token.attrs.delete("value");
            return `html+=\`<button${attributes(token, true)}>${token.text?.args[0] || ""}</button>\`;`;
        });

        const checkboxRadioHandler = (token: STWToken2) => {
            token.attrs.set("name", `"${token.args[1] || ""}" || fieldName`);
            token.attrs.delete("value");

            const options = token.args.slice(3), mode = parseInt(options[0]);
            let js: string = `value=wbpl("${
                token.args[2] ?? ""
            }", ph) || fieldValue, checked = (value === fieldValue ? " checked" : "");`;
            if (isNaN(mode)) {
                return `html+=\`<input${attributes(token)}\${checked}>\`;`;
            }

            js += `html+=\`<fieldset class=\"stwGroup\">\`;`;
            if (mode === 1) {
                for (let i = 1; i < options.length; i += 1) {
                    js += `checked = (value === "${options[i]}" ? " checked" : "");`; // TODO: multiple checkboxes
                    js += `html+=\`<label><input${attributes(token)} value=\"${options[i]}\"\${checked}>${
                        options[i] || ""
                    }</label>\`;`;
                }
            } else if (mode === 2) {
                for (let i = 1; i < options.length; i += 2) {
                    js += `checked = (value === "${options[i]}" ? " checked" : "");`; // TODO: multiple checkboxes
                    js += `html+=\`<label><input${attributes(token)} value=\"${options[i]}\"\${checked}>${
                        options[i + 1] || ""
                    }</label>\`;`;
                }
            }
            js += `html+=\`</fieldset>\`; if (!"${token.args[1]}") fldCursor();`;
            return js;
        };

        handlers.set("c", checkboxRadioHandler);

        const selectHandler = (token: STWToken2) => {
            token.attrs.set("name", `"${token.args[0] || ""}" || fieldName`);
            token.attrs.set("value", `wbpl("${token.args[1] ?? ""}", ph) || fieldValue`);
            if ("sS".includes(token.symbol)) token.attrs.set("multiple", "");

            let js: string = `html+=\`<select${attributes(token)}>${
                "SD".indexOf(token.symbol) < 0 ? "<option></option>" : ""
            }\`;`;
            const options = token.args.slice(2), mode = parseInt(options[0]);
            if (mode === 1) {
                for (let i = 1; i < options.length; i += 1) {
                    js += `html+=\`<option value=\"${options[i]}\">${options[i]}</option>\`;`;
                }
            } else if (mode === 2) {
                for (let i = 1; i < options.length; i += 2) {
                    js += `html+=\`<option value=\"${options[i]}\">${options[i + 1]}</option>\`;`;
                }
            }
            js += `html+=\`</select>\`;if (!"${token.args[0]}") fldCursor();`;
            return js;
        };

        handlers.set("d", selectHandler);
        handlers.set("D", selectHandler);

        const fieldInputHandler = (token: STWToken2, _recurse: boolean = false) => {
            const nameArg = token.symbol === "e" ? token.args[1] : token.args[0];
            const valueArg = token.symbol === "e" ? token.args[2] : token.args[1];

            if (token.symbol === "e") {
                const format = (token.args[0] || "").trim();
                if (format) {
                    const knownTypes = new Set([
                        "text",
                        "number",
                        "password",
                        "email",
                        "url",
                        "tel",
                        "search",
                        "date",
                        "datetime-local",
                        "time",
                        "month",
                        "week",
                        "color",
                        "range",
                    ]);

                    if (knownTypes.has(format)) {
                        token.attrs.set("type", `'${format}'`);
                    } else if (/[#0,.]/.test(format)) {
                        token.attrs.set("type", `'number'`);
                        const decimalMatch = format.match(/\.([#0]+)/);
                        const decimals = decimalMatch ? decimalMatch[1].length : 0;
                        const step = decimals > 0 ? `0.${"0".repeat(decimals - 1)}1` : "1";
                        token.attrs.set("step", `'${step}'`);
                        token.attrs.set("inputmode", `'decimal'`);
                    }
                }
            }

            token.attrs.set("name", `"${nameArg || ""}" || fieldName`);
            token.attrs.set("value", `fieldValue || wbpl("${valueArg ?? ""}", ph)`);

            return `html+=\`<input${attributes(token)}>\`;${!nameArg ? "fldCursor();" : ""}`;
        };
        handlers.set("e", fieldInputHandler);

        handlers.set("f", () => `html+=" "+fieldValue+" ";fldCursor();`);

        handlers.set("h", fieldInputHandler);

        handlers.set("i", (token) => {
            const mode = token.args[0];
            const options = JSON.stringify(token.args.slice(1));

            let srcExpression: string;
            if (mode === "1") {
                srcExpression = `(${options}[Number(fieldValue)-1]||"")`;
            } else if (mode === "2") {
                srcExpression = `(()=>{const opts=${options};let idx=opts.findIndex((v,i)=>i%2===0&&v==String(fieldValue));return (idx!==-1&&opts[idx+1])?opts[idx+1]:opts.at(-1);})()`;
            } else {
                srcExpression = `wbpl(\`${mode || ""}\`, ph)`;
            }

            token.attrs.set("src", `${srcExpression} || fieldName`);
            token.attrs.delete("value");
            return `html+=\`<img${attributes(token)}>\`;fldCursor();`;
        });

        handlers.set(
            "j",
            (token) => `html+=\`<script>\${wbpl("${token.args[0]?.replaceAll('"', '\\"') ?? ''}", ph)}</script>\`;`,
        );
        handlers.set("v", (token) => `html+=\`${eval(token.args[0]) ?? ""}\`;`);

        handlers.set(
            "k",
            (token) => `if ("${token.args[0] ?? ""}") ph.set("${token.args[0]}", "${token.args[1] ?? ""}");`,
        );

        handlers.set("l", (token) => {
            token.attrs.delete("value");
            return `html+=\`<label${attributes(token)}>\${"${token.args[0] ?? ""}" || fieldName}</label>\`;`;
        });

        handlers.set("m", (token) => {
            // Format-aware multi-line input
            // args: [format, name, value]
            const rawFormat = (token.args[0] || "").trim();
            const format = rawFormat.toLowerCase();
            const nameArg = token.args[1];
            const valueArg = token.args[2];

            // Common name binding
            token.attrs.set("name", `"${nameArg || ""}" || fieldName`);

            // No format or explicit textarea/none → render as plain textarea (backward compatible)
            if (!rawFormat || format === "none" || format === "textarea") {
                if (!nameArg && !valueArg) {
                    return `html+=\`<textarea${attributes(token)}>\${fieldValue}</textarea>\`;fldCursor();`;
                }
                return `html+=\`<textarea${attributes(token)}>\${wbpl("${(valueArg ?? "").replaceAll('"','\\"')}", ph) || fieldValue}</textarea>\`;${!nameArg ? "fldCursor();" : ""}`;
            }

            // WYSIWYG via Summernote (if present). Fallback to textarea if library is missing.
            if (format === "wysiwyg") {
                const areaId = crypto.randomUUID();
                if (!token.attrs.has("id")) token.attrs.set("id", `'${areaId}'`);
                const textareaOpen = `html+=\`<textarea${attributes(token)}>`; 
                const textareaClose = `</textarea>\`;`;
                const valueExpr = `\${wbpl("${(valueArg ?? "").replaceAll('"','\\"')}", ph) || fieldValue}`;
                const initScript = `html+=\`<script>(function(id){(window.stwLoadSummernote?stwLoadSummernote():Promise.resolve()).then(function(){try{var el=document.getElementById(id);if(window.jQuery&&jQuery.fn&&jQuery.fn.summernote){jQuery(el).summernote({height:200});}}catch(e){/*noop*/}});})('${areaId}');</script>\`;`;
                return `${textareaOpen}${valueExpr}${textareaClose}${initScript}${!nameArg ? "fldCursor();" : ""}`;
            }

            // Code editor via Ace (if available); otherwise, show a visible textarea.
            // Interpret any other format as a language (html, js, json, sh, css, sql, etc.)
            const editorId = crypto.randomUUID();
            const areaId = crypto.randomUUID();
            const langMap: Record<string, string> = {
                js: "javascript",
                ts: "typescript",
                sh: "sh",
                bash: "sh",
                html: "html",
                css: "css",
                json: "json",
                sql: "sql",
                yaml: "yaml",
                yml: "yaml",
                md: "markdown",
            };
            const aceLang = langMap[format] || format;

            // Build editor wrapper + hidden textarea for form submission
            const editorDiv = `html+=\`<div id="${editorId}" class="stwCodeeditor" style="min-height:200px;border:1px solid var(--border-color);"></div>\`;`;
            if (!token.attrs.has("id")) token.attrs.set("id", `'${areaId}'`);
            const hiddenTAOpen = `html+=\`<textarea${attributes(token)} style="display:none">`;
            const hiddenTAClose = `</textarea>\`;`;
            const valueExpr = `\${wbpl("${(valueArg ?? "").replaceAll('"','\\"')}", ph) || fieldValue}`;
            const initAce = `html+=\`<script>(function(eid,tid,lang){(window.stwLoadAce?stwLoadAce():Promise.resolve()).then(function(){try{if(window.ace&&ace.edit){var ed=ace.edit(eid);ed.session.setMode('ace/mode/'+lang);var ta=document.getElementById(tid);ed.setValue(ta.value||'',-1);ed.session.on('change',function(){ta.value=ed.getValue();});var mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');var applyTheme=function(){var dark=(document.documentElement.getAttribute('data-theme')==='dark')||(mq&&mq.matches);ed.setTheme(dark?'ace/theme/monokai':'ace/theme/chrome');};applyTheme();if(mq&&mq.addEventListener)mq.addEventListener('change',applyTheme);document.addEventListener('stw-themechange',applyTheme);}}catch(e){/*noop*/}});})('${editorId}','${areaId}','${aceLang}');</script>\`;`;
            return `${editorDiv}${hiddenTAOpen}${valueExpr}${hiddenTAClose}${initAce}${!nameArg ? "fldCursor();" : ""}`;
        });

        handlers.set("n", (token) => {
            const mode = token.args[0], options = JSON.stringify(token.args.slice(1));
            if (mode === "1") {
                return `html+=${options}[Number(fieldValue)-1]||"";fldCursor();`;
            }
            if (mode === "2") {
                return `{const opts=${options};let idx=opts.findIndex((v,i)=>i%2===0&&v==String(fieldValue));html+=(idx!==-1&&opts[idx+1])?opts[idx+1]:opts.at(-1);}fldCursor();`;
            }
            return "fldCursor();";
        });

        handlers.set("o", (token) => {
            token.attrs.set("id", crypto.randomUUID());
            token.attrs.set("href", `\${"${token.args[0]}" + "${querystring("/", token.params)}"}`);
            return `html+=\`<article${attributes(token)}></article>\`;`;
        });

        handlers.set("r", checkboxRadioHandler);
        handlers.set("s", handlers.get("d")!);
        handlers.set("S", handlers.get("D")!);
    handlers.set("t", (token, inline = false) => inline ? token.args[0] : `html+=\`${(token.args[0] || "").replace(/`/g, "\\`")}\`;`);

        handlers.set("u", (token) => `html+=\`<input type="file"${attributes(token)}>\`;`);

        handlers.set("w", fieldInputHandler);

        const noOpHandler = () => ``;
        handlers.set("x", noOpHandler);
        handlers.set("y", noOpHandler);
        handlers.set("z", noOpHandler);

        handlers.set("\\r", () => `html+="<br>";`);
        handlers.set("\\n", () => `html+="<br>";`);
        handlers.set("\\t", () => `html+="<label></label>";`);

        handlers.set(">", () => `fldCursor();`);
        handlers.set("<", () => `fldCursor(-1);`);

        return handlers;
    }

    private compileRenderFunction(isInteractive: boolean): string {
        let fn =
            `let html="",fld=0,df=0,fieldName=(fields[0] ?? "stwFld0"),fieldValue=ph.get("@@" + fieldName) ?? "",fldCursor=(df=1)=>{fld+=df; if(fld<0) fld=0; else if (fld>=fields.length) fld=fields.length; fieldName=fields[fld] ?? "stwFld"+fld; fieldValue=ph.get("@@"+fieldName) ?? "";return "";};`;

        for (const token of this.tokens) {
            let handler: ((token: STWToken2, inline: boolean) => string) | undefined;
            let tokenToRender = token;

            if (isInteractive) {
                handler = STWLayout2.tokenHandlers.get(token.symbol);
            } else {
                switch (token.symbol) {
                    case "e":
                    case "w":
                    case "m":
                    case "u":
                        handler = STWLayout2.tokenHandlers.get("f");
                        break;
                    case "b":
                    case "h":
                        handler = undefined; // Render nothing
                        break;
                    case "d":
                    case "D":
                        handler = STWLayout2.tokenHandlers.get("n");
                        tokenToRender = new STWToken2("n", ["2", ...token.args], token.params, token.attrs, token.text);
                        break;
                    case "s": {
                        const options = JSON.stringify(token.args);
                        fn += `{
                            const values = String(fieldValue).split(',').map(s => s.trim());
                            const opts = ${options};
                            const mappedValues = values.map(val => {
                                const idx = opts.findIndex((v, i) => i % 2 === 0 && v === val);
                                return (idx !== -1 && opts[idx + 1]) ? opts[idx + 1] : '';
                            }).filter(v => v);
                            html += mappedValues.join(', ');
                            fldCursor();
                        }`;
                        handler = undefined; // Custom code generated
                        break;
                    }
                    case "c":
                    case "r":
                        tokenToRender = new STWToken2(
                            token.symbol,
                            token.args,
                            token.params,
                            new Map(token.attrs),
                            token.text,
                        );
                        tokenToRender.attrs.set("disabled", "true");
                        handler = STWLayout2.tokenHandlers.get(tokenToRender.symbol);
                        break;
                    default:
                        handler = STWLayout2.tokenHandlers.get(token.symbol);
                }
            }

            if (handler) {
                fn += handler(tokenToRender, false);
            }
        }

        fn += "return html;";
        return fn;
    }
}

export function isTruthy2(val: string | undefined): boolean {
    if (!val || val === "false") return false;
    if (val === "true") return true;
    const num = Number(val);
    return !isNaN(num) && num !== 0;
}
