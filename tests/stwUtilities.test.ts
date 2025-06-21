import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { wbpl } from "../stwComponents/stwUtilities.ts";

const placeholders: Map<string, string> = new Map([
	["@user", "alice"],
	["@role", "admin"],
	["@status", "active"],
	["@@email", "alice@example.com"],
	["@site", "Webbase"],
	["@@phone", "+123456789"],
	["@@session", ""],
	["@@@token", "jwt-token-987654"],
	["@@@lastLogin", "2024-06-19T10:00:00Z"],
	["@numbers", "1,2,3,4,5,6,7,8,9,0"],
	["@string", "Hello ' World"],
	["@string2", "Hello \" World"],
]);

/*
	- Placeholders are sequences of characters that follow this rule: (?>(@{1,3}[a-zA-Z0-9_$.]*[a-zA-Z0-9_])), e.g., @$user, @@email.to, @@@role, @_status_, etc.
	- Placeholders are replaced with their values from a `placeholders` map.
	- If a placeholder is not found in the `placeholders` map it is considered empty, i.e., "".
	- \@ is used to escape the @ character, so it is not treated as part of a placeholder.
	- Square brackets [] delimit text that is to be removed if all placeholders inside them are empty; also, if the brackets end up empty the first sequence of non-whitespace characters (\S+) that follows the closing square brackets is removed, if there is no such sequence to remove, the sequence of non-whitespace characters before the opening bracket is removed. Delimiting square brackets are always removed!
	- Curly brackets {} delimit text that is to be removed if all placeholders inside them are empty. Delimiting curly brackets are always removed! Note: curly brackets DO NOT REMOVE the first sequence of non-whitespace characters (\S+) that follows nor precede them as square brackets do!
	- Square brackets nested inside curly brackets behave as described above.
	- Nested square brackets logic is applied only to innermost sets of square brackets, e.g., given the phrase "Hello [ [@user] ]", the result is "Hello [ alice ]" (the outer brackets are not removed).
	- Placeholders delimited by single (') or double quotes (") must double the quotes inside the placeholder value, e.g., given @name="O'Conner" and the phrase "My name is '@name'" becomes "My name is 'O''Conner'".
	- Ellipses ... after a placeholder delimited by single (') or double quotes (") are replaced with the values of the placeholder, e.g., given @numbers="1,2,3,4,5,6,7,8,9,0" and the phrase "[number in ('@numbers'...)] and" becomes "number in ('1','2','3','4','5','6','7','8','9','0') and".
*/
const examples = [
	{ phrase: "select * from users {where [session = '@string2'] and [status = '@status']}", parsedPhrase: "select * from users where session = 'Hello \" World' and status = 'active'" },
	{ phrase: "select * from users {where [session = \"@string2\"] and [status = '@status']}", parsedPhrase: "select * from users where session = \"Hello \"\" World\" and status = 'active'" },
	{ phrase: "I will {[@go]; go! [@site]}", parsedPhrase: "I will ; go! Webbase" },
	{ phrase: "[ @@session ], foo", parsedPhrase: ", foo" },
	{ phrase: "well? [ hello @@session ], foo", parsedPhrase: "well? , foo" },
	{ phrase: "Hello [[\\@@user]], welcome to @site!", parsedPhrase: "Hello [@alice], welcome to Webbase!" },
	{ phrase: "Hello @user, welcome to @site!", parsedPhrase: "Hello alice, welcome to Webbase!" },
	{ phrase: "Hello \\@@user, welcome to @site!", parsedPhrase: "Hello @alice, welcome to Webbase!" },
	{ phrase: "Hello [ @@session ]", parsedPhrase: "Hello " },
	{ phrase: "{Hello [ @@session ]}, foo", parsedPhrase: ", foo" },
	{ phrase: "{[@user] Hello [ @@session ]}, foo", parsedPhrase: "alice Hello , foo" },
	{ phrase: "Hello { [@foo] and [ @@session ]     \n     }", parsedPhrase: "Hello " },
	{ phrase: "[number in ('@numbers'...)] and", parsedPhrase: "number in ('1','2','3','4','5','6','7','8','9','0') and" },
	{ phrase: "[number in (\"@numbers\"...)] and", parsedPhrase: "number in (\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\",\"0\") and" },
	{ phrase: "Hello [ @@session ]", parsedPhrase: "Hello " },
	{ phrase: "'@string'", parsedPhrase: "'Hello '' World'" },
	{ phrase: "select * from users where [session = '@session'] and role = '@role'", parsedPhrase: "select * from users where  role = 'admin'" },
	{ phrase: "I will [@go]; go!", parsedPhrase: "I will ; go!" },
	{ phrase: "I will {[@go]; go!}", parsedPhrase: "I will " },
];

Deno.test("examples", async () => {
	let fails = 0;

	let log = `wbpl test failures: ${new Date().toISOString()}\n\nPlaceholders:\n`;
	for (const [key, value] of placeholders)
		log += `\t${key}: ${value || "EMPTY"}\n`;
	log += "\nFailures:\n";

	for (const [_i, ex] of examples.entries()) {
		const actual = wbpl(ex.phrase, placeholders);
		if (actual != ex.parsedPhrase) {
			++fails;
			log += `Phrase:   "${ex.phrase}"\nExpected: "${ex.parsedPhrase}"\nActual:   "${actual}"\n\n`;
		}
	}
	await Deno.writeTextFile("./tests/stwUtilities.test.log", log + (fails ? "" : "All tests passed!\n"));
	assertEquals(fails, 0, `${fails} test(s) failed!`);
});
