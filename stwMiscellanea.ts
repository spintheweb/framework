/**
 * Spin the Web Site miscellanea functions
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/

/**
 * Return langs RFC 3282 as a language array sorted by preference
 * 
 * @param acceptLanguage 
 * @param _availableLanguages 
 * @returns 
 */
export function pickLanguage(acceptLanguage: string, _availableLanguages: string) {
	const pattern = /([a-z][a-z](-[a-z][a-z])?|\*)(;q=([01](\.[0-9]+)?))?/gi;
	let match, accept = '';
	while (match == pattern.exec(acceptLanguage)) {
		pattern.lastIndex += (match.index === pattern.lastIndex);
		accept += (accept !== '' ? ',' : '[') + `{"l":"${match[1]}","q":${match[4] || 1}}`;
	}
	return JSON.parse(accept + ']').sort((a, b) => a.q < b.q).map(a => a.l);
}

/**
 * Given a string with placeholders, a placeholder is a variable prefixed with @ or @@, replace the placeholders applying {[]} be.
 * 
 * Placeholders that start with a single @ can reference cookies or query string keys, these are termed exposed parameters
 * Placeholders that start with a double @@ can reference data source fields, session, application or server variables, these are termed unexposed parameters
 * 
 * TODO: remove trailing or leading word ... '' ""
 * 
 * @param text 
 * @param exposed 
 * @param unexposed 
 * @returns 
 */
export function processPlaceholders(text: string, exposed: Map<string, string | number | Date>, unexposed: Map<string, string | number | Date>) {
	text = text.replace(/(\b\s*|\W\s*)?(\[.*?\])(\s*\b|\s*\W)?/g, function (match, p1, p2, p3, _offset, _s) {
		let flag: boolean = false;
		match = match.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (_match, p1, _offset, _s) {
			if (p1.charAt(0) === "/") return p1.substr(1);
			if (p1.charAt(1) === '@') {
				if (unexposed.has(p1.substr(1))) {
					flag = true;
					return unexposed.get(p1.substr(2)) instanceof Date ? unexposed.get(p1.substr(2))?.toJSON() : unexposed.get(p1.substr(2));
				}
			} else if (exposed.has(p1.substr(1))) {
				flag = true;
				return exposed.get(p1.substr(1)) instanceof Date ? exposed.get(p1.substr(1)).toJSON() : exposed.get(p1.substr(1));
			}
			return '';
		});
		if (flag) 
			return p1 + p2.substr(1, p2.length - 2) + p3; // Remove []
		if (p3) 
			return p1;
		return "";
	});

	return text.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (_match, p1, _offset, _s) {
		if (p1.charAt(0) === '/')
			return p1.substr(1);
		if (p1.charAt(1) === '@') 
			return unexposed.get(p1.substr(2)) instanceof Date ? unexposed.get(p1.substr(2)).toJSON() : unexposed.get(p1.substr(2)) || "";
		
		return (exposed.get(p1.substr(1)) instanceof Date ? exposed.get(p1.substr(1)).toJSON() : exposed.get(p1.substr(1))) || "";
	});
}