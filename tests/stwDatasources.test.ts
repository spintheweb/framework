// SPDX-License-Identifier: MIT
// Test suite: stwDatasources.test

import { assertEquals, assert, assertFalse } from "@std/assert";
import jsonata from "https://esm.sh/jsonata@latest";
import { STWDatasources } from "../stwComponents/stwDatasources.ts";
import { STWSession } from "../stwComponents/stwSession.ts";
import { STWSite } from "../stwElements/stwSite.ts";
import { STWContent } from "../stwElements/stwContent.ts";

// Mock STWSite and STWContent
class MockSite { }
class MockContent {
	dsn = "stw";
	query = "$..*";
}

// Mock session
const session = {
	site: new MockSite(),
	placeholders: new Map([["@_id", "mockid"]])
} as unknown as STWSession;
/*
Deno.test("STWDatasources.query returns webbase data for dsn=stw", async () => {
	// Patch STWSite.index for fetchWebbaseData
	const element = { foo: "bar" };
	const origIndex = (STWSite as any).index;
	(STWSite as any).index = new Map([["mockid", element]]);

	const result = await STWDatasources.query(session, new MockContent() as STWContent);
	assert(result.rows.length === 1);
	assertEquals(result.rows[0], element);

	// Restore
	(STWSite as any).index = origIndex;
});

Deno.test("STWDatasources.query returns empty rows if no dsn/query", async () => {
	const content = { dsn: "", query: "" } as STWContent;
	const result = await STWDatasources.query(session, content);
	assertEquals(result.rows, []);
});

Deno.test("STWDatasources.query handles errors gracefully", async () => {
	// Force error by patching JSON.parse
	const origParse = JSON.parse;
	JSON.parse = () => { throw new Error("fail"); };
	const content = { dsn: "stw", query: "$..*" } as STWContent;
	const result = await STWDatasources.query(session, content);
	assertEquals(result.rows, []);
	JSON.parse = origParse;
});
*/



Deno.test("JSONata queries WBDL", async () => {
	const wbdlFile: string = Deno.env.get("SITE_WEBBASE") || "./public/.data/webapplication.wbdl";
	const wbdlText = await Deno.readTextFile(wbdlFile);
	const wbdlData = JSON.parse(wbdlText);

	let result_ = undefined;
	const query = `$keys(visibility)\@$v.{"name": $v,"value": $lookup(visibility, $v)}`;

	let log = `JSONata test: ${new Date().toISOString()}\n\n${wbdlText}\n\n`;

	let fails = 0;
	try {
		const expr = jsonata(query);
		result_ = await expr.evaluate(wbdlData);
		log += `Query: "${query}"\nResult: ${JSON.stringify(result_)}\n\n`;
		assert(result_ !== undefined, `Query "${query}" returned undefined`);
	} catch (error) {
		++fails;
		log += `Error in JSONata: "${query}"\n${error}\n\n`;
		assertFalse(true, `JSONata query "${query}" failed: ${error}`);
	}

	await Deno.writeTextFile("./tests/stwDatasources.test.log", log + (fails ? "" : "All tests passed!\n"));
});