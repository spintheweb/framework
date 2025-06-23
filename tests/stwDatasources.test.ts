import { assertEquals, assert } from "@std/assert";
import { STWDatasources } from "../stwComponents/stwDatasources.ts";
import { STWSession } from "../stwComponents/stwSession.ts";
import { STWSite } from "../stwElements/stwSite.ts";
import { STWContent } from "../stwElements/stwContent.ts";

// Mock STWSite and STWContent
class MockSite {}
class MockContent {
  dsn = "stw";
  query = "$..*";
}

// Mock session
const session = {
  site: new MockSite(),
  placeholders: new Map([["@_id", "mockid"]])
} as unknown as STWSession;

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