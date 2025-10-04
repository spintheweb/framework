// SPDX-License-Identifier: MIT
// Compute SHA256 hashes of critical source files to detect drift between deployments.

const CRITICAL_FILES = [
  'stwElements/stwElement.ts',
  'stwElements/stwContent.ts',
  'stwElements/stwSite.ts',
  'stwElements/stwPage.ts',
  'stwSpinner.ts',
  'stwComponents/stwFactory.ts',
  'stwComponents/stwResponse.ts'
];

interface IntegrityEntry { file: string; sha256: string; size: number; mtime?: string }

async function hashFile(path: string): Promise<IntegrityEntry> {
  const data = await Deno.readFile(path);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const info = await Deno.stat(path);
  return { file: path, sha256: hashHex, size: info.size, mtime: info.mtime?.toISOString() };
}

const results: IntegrityEntry[] = [];
for (const file of CRITICAL_FILES) {
  try {
    results.push(await hashFile(file));
  } catch (err) {
    console.error(`Failed to hash ${file}: ${(err as Error).message}`);
  }
}

// Aggregate a composite hash (hash of concatenated individual hashes in order)
const composite = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(results.map(r => r.sha256).join('')));
const compositeHex = Array.from(new Uint8Array(composite)).map(b => b.toString(16).padStart(2, '0')).join('');

await Deno.writeTextFile('integrity.json', JSON.stringify({ generated: new Date().toISOString(), composite: compositeHex, files: results }, null, 2));
console.log(`Integrity file written. Composite hash: ${compositeHex}`);
