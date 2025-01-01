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
	timestamp: number; // Session timeout in minutes
	dev: false; // If true STWManager enabled
	debug: false; // If true and dev is true contents properties are shown
	timer: number;

	constructor(sessionId: string) {
		this.sessionId = sessionId;
		this.user = "guest";
		this.roles = ["guests"];
		this.lang = "en";
		this.timestamp = Date.now();
		this.dev = false;
		this.debug = false;

		this.timer = setInterval(this.timeout, (Deno.env.get("TIMEOUT") || 15) * 60000); // Session timeout
	}

	timeout() {
		clearInterval(this.timer);
		console.info("What to keep the session alive?");
	}

	refresh() {
		clearInterval(this.timer);
		this.timestamp = Date.now();

		this.timer = setInterval(this.refresh, (Deno.env.get("TIMEOUT") || 15) * 60000);
	}
}

// deno-lint-ignore no-explicit-any
export const STWFactory: { [key: string]: new (element: any) => any } = {};
