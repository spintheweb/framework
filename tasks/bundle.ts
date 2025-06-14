import { bundle } from "https://deno.land/x/emit/mod.ts";

const result = await bundle("stwSpinner.ts");
await Deno.writeTextFile("dist/bundle.js", result.code);
console.log("Bundle created at dist/bundle.js");