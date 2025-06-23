import { minify } from "minify";

const inputJs = await Deno.readTextFile("./public/scripts/stwClient.js");
const outputJs = await minify("js", inputJs);
await Deno.writeTextFile("./public/scripts/stwClient.min.js", outputJs);

console.log("Client-side JS minified successfully!");
