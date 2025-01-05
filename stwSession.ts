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

		console.info(`${new Date().toISOString()}: Session [${this.sessionId}]`);
	}

	protected timeout(timer: number) {
		clearTimeout(timer);
		console.info(`${new Date().toISOString()}: Want to keep the session [${this.sessionId}] alive?`);

		this.timer = setTimeout(() => this.timeout(this.timer), parseInt(Deno.env.get("TIMEOUT") || "15") * 60000); // Session timeout
	}
}

// deno-lint-ignore no-explicit-any
export const STWFactory: { [key: string]: new (element: any) => any } = {};
