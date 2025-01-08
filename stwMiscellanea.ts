/**
 * Spin the Web Site miscellanea functions
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/

/**
 * Given text sprinkeled with placeholders, a placeholder is a variable prefixed with \@, \@@ or \@@@, replace the placeholders applying these rules:
 * * Replace the placeholder with its value
 * * If the placeholder has no value and is inside square brackets ([]): remove everything within and including the square brackets and the first word next to the closing bracket (]) or the first word preceeding the opening bracket ([) 
 * * If the placeholder has a value and is inside square brackets simply remove the square brackets
 * * Braces ({}) confine the behavior of square brackets, and are removed
 * * If a placeholder is surronded by single (') or double quotes ("), double all single or double quotes in the value
 * * If a placeholder is enclosed within single (') or double (") quotes immediately followed by ellipses (...) and its value is a comma separated list of values then each of the these values will be enclosed in single or double quotes else the placeholder is replace with its value in all cases the ellipses are removed
 * 
 * TODO: remove trailing or leading word ... '' "". What practical use could `` have?
 * 
 * @param text Text sprinkeled with placeholders \@\<name>, \@@\<name> and or \@@@<name>
 * @param placeholders Placeholders values
 * @returns 
 */
export function processPlaceholders(text: string, placeholders: Map<string, string>) {
	text = text.replace(/(\b\s*|\W\s*)?(\[.*?\])(\s*\b|\s*\W)?/g, function (match, p1, p2, p3, _offset, _s) {
		let flag: boolean = false;
		match = match.replace(/(\/?@@\*?[_a-z][a-z0-9_.$]*)/ig, function (_match, p1, _offset, _s) {
			if (p1.charAt(0) === "/") return p1.substr(1);
			if (p1.charAt(1) === '@') {
				if (placeholders.has(p1.substr(1))) {
					flag = true;
					return placeholders.get(p1.substr(2));
				}
			} else if (placeholders.has(p1.substr(1))) {
				flag = true;
				return placeholders.get(p1.substr(1));
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
			return placeholders.get(p1.substr(2)) || "";
		
		return placeholders.get(p1.substr(1)) || "";
	});
}