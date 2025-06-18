import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { rePlaceholders } from "../stwUtilities.ts";

Deno.test("rePlaceholders replaces placeholders with values from Map", () => {
	const placeholders = new Map([
		["@name", "Alice"],
		["@city", "Wonderland"],
	]);
	const input = "Hello, @name! Welcome to @city.";
	const output = rePlaceholders(input, placeholders);
	assertEquals(output, "Hello, Alice! Welcome to Wonderland.");
});

Deno.test("rePlaceholders removes unknown placeholders", () => {
	const placeholders = new Map([["@foo", "bar"]]);
	const input = "Test @foo and {@baz}.";
	const output = rePlaceholders(input, placeholders);
	assertEquals(output, "Test bar and .");
});

Deno.test("rePlaceholders works with empty placeholders", () => {
	const placeholders = new Map();
	const input = "Nothing to replace here.";
	const output = rePlaceholders(input, placeholders);
	assertEquals(output, "Nothing to replace here.");
});

Deno.test("rePlaceholders replaces multiple occurrences", () => {
	const placeholders = new Map([["@x", "1"]]);
	const input = "@x + @x = 2";
	const output = rePlaceholders(input, placeholders);
	assertEquals(output, "1 + 1 = 2");
});