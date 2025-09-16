// SPDX-License-Identifier: MIT
// Test suite: stwContent.test

import { assertEquals } from "@std/assert";
import { STWText } from "../stwContents/stwText.ts";
import { STWSite } from "../stwElements/stwSite.ts";

// Mock session object
const mockSession = { lang: "en" };

// Minimal site instance for parent
const site = new STWSite({
  _id: crypto.randomUUID(),
  type: "Site",
  name: { en: "Test Site" },
  slug: { en: "test-site" }
});

Deno.test("STWText: constructor sets properties", () => {
  const content = new STWText({
    _id: crypto.randomUUID(),
    type: "Text",
    name: { en: "Test Content" },
    slug: { en: "test-content" }
  });
  content.parent = site;
  assertEquals(typeof content._id, "string");
  assertEquals(content.name.get("en"), "Test Content");
});

Deno.test("STWText: localize returns correct value", () => {
  const content = new STWText({
    _id: crypto.randomUUID(),
    type: "Text",
    name: { en: "Test Content" },
    slug: { en: "test-content" }
  });
  content.parent = site;
  const result = content.localize(mockSession, "name");
  assertEquals(result, "Test Content");
});

Deno.test("STWText: localize sets and returns new value", () => {
  const content = new STWText({
    _id: crypto.randomUUID(),
    type: "Text",
    name: { en: "Test Content" },
    slug: { en: "test-content" }
  });
  content.parent = site;
  const newValue = content.localize(mockSession, "name", "Updated Content");
  assertEquals(newValue, "Updated Content");
  assertEquals(content.name.get("en"), "Updated Content");
});