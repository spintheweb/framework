import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { STWLayout } from "../stwContents/wbll.ts";
import { rePlaceholders } from "../stwUtilities.ts";

Deno.test("STWLayout renders static text", () => {
	const layout = new STWLayout("t('Hello World')");
	const html = layout.render("text", {} as any, {} as any, { rows: [{}] }, new Map(), rePlaceholders);
	assertEquals(html, "Hello World");
});

Deno.test("STWLayout renders with placeholders", () => {
	const layout = new STWLayout("t('Hello, @@name!')");
	const placeholders = new Map([["@@name", "Alice"]]);
	const html = layout.render("text", {} as any, {} as any, { rows: [{}] }, placeholders, rePlaceholders);
	assertEquals(html, "Hello, Alice!");
});

Deno.test("STWLayout supports attributes", () => {
	const layout = new STWLayout("\\A('class=\"greeting\"')t('Hi')");
	const html = layout.render("text", {} as any, {} as any, { rows: [{}] }, new Map(), rePlaceholders);
	// Should include the class attribute in the output
	assertEquals(html.includes('class="greeting"'), true);
	assertEquals(html.includes("Hi"), true);
});