// SPDX-License-Identifier: MIT
// Build/development task: ensure-headers

// Ensure SPDX headers across all .ts files in the repo
// Usage: deno run --allow-read --allow-write tasks/ensure-headers.ts

const SPDX = "// SPDX-License-Identifier: MIT";
const DOC_BLOCK_START = "/**";
const DOC_BLOCK_END = "*/";

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

function generateDoc(file: string): string {
  const rel = file.replace(Deno.cwd().replaceAll("\\", "/") + "/", "");
  const parts = rel.split("/");
  const base = parts[parts.length - 1];
  const name = base.replace(/\.ts$/, "");

  const lower = name.toLowerCase();
  // Specific adapters
  if (rel.includes("stwComponents/stwDBAdapters/")) {
    if (lower === "adapter") return "Database adapter interface for Spin the Web.";
    if (lower === "mysql") return "MySQL database adapter for Spin the Web.";
    if (lower === "postgres") return "PostgreSQL database adapter for Spin the Web.";
    if (lower === "sqlserver") return "SQL Server database adapter for Spin the Web.";
    if (lower === "mongodb") return "MongoDB adapter for Spin the Web.";
    if (lower === "oracle") return "Oracle database adapter (SQLcl/CLI) for Spin the Web.";
    return "Database adapter module for Spin the Web.";
  }
  if (rel.endsWith("/stwSpinner.ts")) return "Spin the Web runtime entrypoint and server bootstrap.";
  if (rel.startsWith("stwComponents/")) return `Spin the Web component: ${name}.`;
  if (rel.startsWith("stwElements/")) return `Spin the Web element: ${name}.`;
  if (rel.startsWith("tasks/")) return `Build/development task: ${name}.`;
  if (rel.startsWith("tests/")) return `Test suite: ${name}.`;
  return `Spin the Web module: ${rel}.`;
}

function buildDocLine(desc: string): string {
  // Remove a trailing period from the description to keep the header concise
  const normalized = desc.replace(/\.[\s]*$/, "");
  return `// ${normalized}`;
}

async function ensureHeader(file: string): Promise<boolean> {
  const text = await Deno.readTextFile(file);
  const hasShebang = text.startsWith("#!");
  const shebangEnd = hasShebang ? text.indexOf("\n") + 1 : 0;
  let rest = text.slice(shebangEnd);

  let changed = false;

  // Ensure SPDX at the very top (after shebang if present)
  if (!rest.startsWith(SPDX)) {
    rest = `${SPDX}\n${rest}`;
    changed = true;
  }

  // After SPDX, ensure a concise single-line doc, replacing any existing immediate comment
  const desc = generateDoc(file);
  const docLine = buildDocLine(desc);

  // Drop blank lines after SPDX
  let after = rest.slice(SPDX.length);
  const BLANK_RE = /^(\r?\n)+/;
  const m = after.match(BLANK_RE);
  if (m) after = after.slice(m[0].length);

  const trimmedAfter = after.trimStart();
  if (trimmedAfter.startsWith(DOC_BLOCK_START)) {
    // Remove existing block comment
    const startIdx = after.indexOf(DOC_BLOCK_START);
    const endIdx = after.indexOf(DOC_BLOCK_END, startIdx + DOC_BLOCK_START.length);
    if (endIdx !== -1) {
      const afterDoc = after.slice(endIdx + DOC_BLOCK_END.length);
      const afterDocStripped = afterDoc.replace(/^(\r?\n)+/, "");
      rest = `${SPDX}\n${docLine}\n\n${afterDocStripped}`;
      changed = true;
    } else {
      // Malformed block; inject our line doc before
      rest = `${SPDX}\n${docLine}\n\n${after}`;
      changed = true;
    }
  } else if (trimmedAfter.startsWith("//")) {
    // Replace first line comment with our doc line
    // Find the first non-empty line after any leading whitespace
    const leadingWhitespaceLen = after.length - trimmedAfter.length;
    const afterNoLead = after.slice(leadingWhitespaceLen);
    const nl = afterNoLead.indexOf("\n");
    const remainder = nl === -1 ? "" : afterNoLead.slice(nl + 1).replace(/^(\r?\n)+/, "");
    rest = `${SPDX}\n${docLine}\n\n${remainder}`;
    changed = true;
  } else {
    // No immediate comment; insert our doc line
    rest = `${SPDX}\n${docLine}\n\n${after}`;
    changed = true;
  }

  // Re-prepend shebang if it was present
  const updated = hasShebang ? text.slice(0, shebangEnd) + rest : rest;

  if (changed) {
    await Deno.writeTextFile(file, updated);
  }
  return changed;
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
