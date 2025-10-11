// SPDX-License-Identifier: MIT
// WBLL2 tests for JS-like argument syntax
import { STWLayout2 } from "../stwComponents/stwWBLL2.ts";
import { assertEquals } from "@std/assert";

Deno.test("t() plain text with commas and quotes", () => {
  const wbll = "t('Hello, world and `quotes`')";
  const l = new STWLayout2(wbll);
  const html = l.render(new Request("http://localhost"), {} as any, [], new Map());
  assertEquals(html, "Hello, world and `quotes`");
});

Deno.test("a() link with chained params and text token", () => {
  const wbll = "a(`/path`)   p('q', '1') p('name', `Doe`) t('Click')";
  const l = new STWLayout2(wbll);
  const html = l.render(new Request("http://localhost"), {} as any, [], new Map());
  // href order can vary; assert structure
  assertEquals(/<a href="http:\/\/localhost\/path\?q=1&name=Doe">Click<\/a>/.test(html), true);
});

Deno.test("b() button takes t() as next token text", () => {
  const wbll = "b() t('Go')";
  const l = new STWLayout2(wbll);
  const html = l.render(new Request("http://localhost"), {} as any, [], new Map(), true);
  assertEquals(/<button name="stwAction" type="button">Go<\/button>/.test(html), true);
});

Deno.test("\\a backtick attribute blob", () => {
  const wbll = "a('/x')\\a(`class='x' data-x=\"1\" aria-label=\"multi word\"`)t('X')";
  const l = new STWLayout2(wbll);
  const html = l.render(new Request("http://localhost"), {} as any, [], new Map(), true);
  assertEquals(/<a class=\'x\' data-x=\"1\" aria-label=\"multi word\"[^>]*>X<\/a>/.test(html), true);
});
