/**
 * Spin the Web session
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
export class STWSession {
	user: string // User name
	roles: string[]; // Roles played by the user. Note: Security revolves around this aspect!
	lang: string; // Preferred user language 
	timestamp: number; // Session timeout in minutes
	dev: false; // If true STWManager enabled
	debug: false; //

	constructor() {
		this.user = "guest";
		this.roles = ["guests"];
		this.lang = "en";
		this.timestamp = Date.now();
		this.dev = false;
		this.debug = false;
	}
}

// deno-lint-ignore no-explicit-any
export const STWFactory: { [key: string]: new (element: any) => any } = {};
