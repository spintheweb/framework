import { getCookies } from "jsr:@std/http/cookie";

/**
 * Spin the Web session
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
export class STWSession {
	sessionId: string;
	user: string // User name
	roles: string[]; // Roles played by the user. Note: Security revolves around this aspect!
	lang: string; // Preferred user language 
	langs: string[]; // Accept-Language
	timestamp: number; // Session timeout in minutes
	dev: boolean; // If true STW Studio  enabled
	debug: boolean; // If true and dev is true contents properties are shown
	placeholders: Map<string, string>;
	private timer: number = 0;

	constructor(sessionId: string) {
		this.sessionId = sessionId;
		this.user = "guest";
		this.roles = ["guests", "developers"];
		this.lang = "en";
		this.langs = ["en"];
		this.timestamp = Date.now();
		this.dev = true;
		this.debug = true;
		this.placeholders = new Map<string, string>;

		console.info(`${new Date().toISOString()}: New session [${this.sessionId}]`);
	}

	/**
	 * @param name Name of the placeholder, it has to start with either \@ (Cookie or Querystring), \@@ (Record) or \@@@ (Headers)
	 * @returns The value of placeholder
	 */
	getPlaceholder(name: string): string {
		return this.placeholders.get(name) || "";
	}
	/**
	 * Placeholders reppresent server side data accessible to contents. Each request received by the server resets the placeholder,
	 * then, the content being rendered cycles each record of the record set. 
	 * 
	 * @param _obj Can be a request a string or an object (a row of a record set)
	 * @param _value The value assigned _obj it it is a string
	 */
	// deno-lint-ignore no-explicit-any
	setPlaceholders(_obj: Request | string | any, _value: string = ""): void {
		if (_obj instanceof Request) {
			this.placeholders.clear();

			(new URL(_obj.url)).searchParams.forEach((value, key) => this.placeholders.set(`@${key}`, value));

			const cookies = getCookies(_obj.headers);
			Object.keys(cookies).forEach(key => this.placeholders.set(`@${key}`, cookies[key]))

			for (const [key, value] of _obj.headers)
				this.placeholders.set(`@@@${key}`, value);

		} else if (typeof _obj === "string")
			this.placeholders.set(`@@${_obj}`, _value);

		else
			Object.keys(_obj).forEach(key => this.placeholders.set(`@@${key}`, _obj[key]))
	}

	protected timeout(timer: number) {
		clearTimeout(timer);
		console.info(`${new Date().toISOString()}: Want to keep the session [${this.sessionId}] alive?`);

		this.timer = setTimeout(() => this.timeout(this.timer), parseInt(Deno.env.get("TIMEOUT") || "15") * 60000); // Session timeout
	}
}

// deno-lint-ignore no-explicit-any
export const STWFactory: { [key: string]: new (element: any) => any } = {};
