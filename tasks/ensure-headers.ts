// Ensure SPDX headers across all .ts files in the repo
// Usage: deno run --allow-read --allow-write tasks/ensure-headers.ts

const SPDX = "// SPDX-License-Identifier: MIT";

// Directories to skip (relative to CWD)
const SKIP_DIRS = new Set([
  ".git",
  ".vscode",
  "public", // static assets
  "schemas", // third-party schemas / docs
  "wiki", // docs
]);

// File patterns to skip
function shouldSkipFile(path: string): boolean {
  return path.endsWith(".d.ts");
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      const base = entry.name;
      if (!SKIP_DIRS.has(base)) {
        yield* walk(full);
      }
    } else if (entry.isFile && entry.name.endsWith(".ts") && !shouldSkipFile(full)) {
      yield full;
    }
  }
}

async function ensureHeader(file: string): Promise<boolean> {
  const text = await Deno.readTextFile(file);
  if (text.includes(SPDX)) return false; // already present somewhere

  // Respect shebang line
  let updated = "";
  if (text.startsWith("#!")) {
    const nlIdx = text.indexOf("\n");
    const shebang = text.slice(0, nlIdx + 1);
    const rest = text.slice(nlIdx + 1);
    updated = `${shebang}${SPDX}\n${rest}`;
  } else {
    updated = `${SPDX}\n${text}`;
  }
  await Deno.writeTextFile(file, updated);
  return true;
}

async function main() {
  const cwd = Deno.cwd().replaceAll("\\", "/");
  let changed = 0;
  for await (const file of walk(cwd)) {
    const did = await ensureHeader(file);
    if (did) changed++;
  }
  console.log(`Headers ensured. Files updated: ${changed}`);
}

if (import.meta.main) {
  await main();
}
