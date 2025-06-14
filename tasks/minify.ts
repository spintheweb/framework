import { minify } from "https://deno.land/x/minify@v0.1.4/mod.ts";

// Minify the bundled JS
const bundle = await Deno.readTextFile("dist/bundle.js");
const minified = minify(bundle, { type: "js" });
await Deno.writeTextFile("dist/bundle.min.js", minified);
console.log("Minified bundle written to dist/bundle.min.js");

// Optionally, minify all JS files in public/scripts
for await (const entry of Deno.readDir("public/scripts")) {
  if (entry.isFile && entry.name.endsWith(".js")) {
	const js = await Deno.readTextFile(`public/scripts/${entry.name}`);
	const minifiedJs = minify(js, { type: "js" });
	await Deno.writeTextFile(`public/scripts/${entry.name.replace(/\.js$/, ".min.js")}`, minifiedJs);
	console.log(`Minified: public/scripts/${entry.name}`);
  }
}
