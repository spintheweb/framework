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
export function rePlaceholders(text: string, placeholders: Map<string, string>): string {
	// Mark \@ sequences
	text = text.replaceAll("\\@", "<stwAT>");

	// Mark available and unavailable placeholders
	let copy = "";
	text.matchAll(/\{([^}].*(?<!\\)@{1,}[a-z_]\w*.*)\}|\[([^}].*(?<!\\)@{1,}[a-z_]\w*.*)\]|(?<!\\)@{1,}[a-z0-9_]\w*|.*/gm).forEach((phrase: RegExpExecArray) => {
		if (phrase[0]) {
			const rephrase = phrase[0].replaceAll(/@{1,}[a-z0-9_]\w*/gm, (placeholder: string) =>
				placeholders.has(placeholder) ? "<stw_" + placeholder + ">" : "<stwNA>"
			);
			copy += rephrase; // \n
		}
	});
	text = copy;

	// Remove brakets surrounding available placeholders
	text.matchAll(/\[.*<stw_.*?\]/mg).forEach((phrase: RegExpExecArray) => {
		if (phrase[0].substring(1).indexOf("[") == -1)
			text = text.replace(phrase[0], phrase[0].substring(1, phrase[0].length - 1));
	});
	text.matchAll(/\[.*<stw_.*\]/mg).forEach((phrase: RegExpExecArray) =>
		text = text.replace(phrase[0], phrase[0].substring(1, phrase[0].length - 1))
	);

	// Remove brakets surrouning empty placeholders along with right or left hand first word TODO: {}
	text.matchAll(/\[[^\]]*\<stwNA>.*\]/mg).forEach((phrase: RegExpExecArray) =>
		text = text.replace(phrase[0], "<stwRL>")
	);

	// Double the quotes ('"|) of placeholders values enclosed in quotes and repeat if ...
	text.matchAll(/".*?(\<stw_(@{1,3}[a-z0-9_]+)\>).*?(?<!\\)"(\.\.\.)?/mg).forEach(phrase => {
		if (phrase[3] === "...") {
			const values = (placeholders.get(phrase[2]) || "").split(",").map(value => `"${value.replaceAll('"', '""')}"`).join(",");
			text = text.replace(phrase[0], values);
		} else
			text = text.replace(phrase[0], phrase[0].replace(phrase[1], (placeholders.get(phrase[2]) || "").replace('"', '""')))
	});
	text.matchAll(/'.*?(\<stw_(@{1,3}[a-z0-9_]+)\>).*?(?<!\\)'(\.\.\.)?/mg).forEach(phrase => {
		if (phrase[3] === "...") {
			const values = (placeholders.get(phrase[2]) || "").split(",").map(value => `'${value.replaceAll("'", "''")}'`).join(",");
			text = text.replace(phrase[0], values);
		} else
			text = text.replace(phrase[0], phrase[0].replace(phrase[1], (placeholders.get(phrase[2]) || "").replace("'", "''")));
	});
	text.matchAll(/\|.*?(\<stw_(@{1,3}[a-z0-9_]+)\>).*?(?<!\\)'(\.\.\.)?/mg).forEach(phrase =>
		text = text.replace(phrase[0], placeholders.get(phrase[2])?.replaceAll(/('")/mg, "$1$1") || "")
	);

	// Replace placeholders
	text.matchAll(/\<stw_(@{1,3}[a-z0-9_]+)\>/gm).forEach((placeholder: RegExpExecArray) =>
		text = text.replace(placeholder[0], placeholders.get(placeholder[1])?.replace(/(['"])/gm, "$1") || "")
	);

	// Clean-up
	text = text.replaceAll("<stwNA>", "");
	return text.replaceAll("<stwAT>", "@");
}

/*
const placeholders = new Map([
	["@a", "fufi'"], 
	["@@@hello", "buh"],
	["@pluto", "1\",2,3"]
]);

const text = `this is very nice
{more[...this is \\@'hello @a' [@a] [test]]}
{[...@b this is @a test @@@hello] [well @x]}
@@@hello "@pluto"...
info\\@keyvisions.it`;

console.clear();
console.info(text);
console.log(processPlaceholders2(text, placeholders));
*/