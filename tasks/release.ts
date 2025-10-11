// tasks/release.ts - Build a single deployment stack bundle
// deno run --allow-read --allow-write --allow-run tasks/release.ts [--version vX.Y.Z]

// Minimal bundle producer: outputs deployment/release/webspinner-stack-<version>.zip
// Contents:
//   - deployment/docker.sh
//   - deployment/server.sh
//   - Dockerfile, docker-compose.yml
//   - README.md (top-level) and deployment/README.md

// Lightweight path helpers to avoid external imports
function norm(p: string): string {
	// Use forward slashes; Deno can handle them on Windows too
	return p.replaceAll("\\", "/").replace(/\/+/, "/");
}
function join(...parts: string[]): string {
	return norm(parts.join("/"));
}
function basename(p: string): string {
	const n = norm(p);
	const idx = n.lastIndexOf("/");
	return idx >= 0 ? n.slice(idx + 1) : n;
}

function getArg(name: string, def?: string): string | undefined {
	const idx = Deno.args.findIndex((a) => a === `--${name}`);
	if (idx >= 0) return Deno.args[idx + 1];
	return def;
}

function getFlag(name: string): boolean {
	return Deno.args.includes(`--${name}`);
}

const cwd = Deno.cwd();

async function readPackageVersion(): Promise<string> {
	try {
		const txt = await Deno.readTextFile(join(cwd, "deno.json"));
		const json = JSON.parse(txt);
		const v = json?.version ?? "0.0.0";
		return typeof v === "string" ? v : "0.0.0";
	} catch {
		return "0.0.0";
	}
}

function ensureV(v: string): string {
	return v.startsWith("v") ? v : `v${v}`;
}

const cliVersion = getArg("version");
const baseVersion = await readPackageVersion();
const version = cliVersion ?? ensureV(baseVersion);
const outDir = join(cwd, "deployment", "release");
await Deno.mkdir(outDir, { recursive: true });

// Helper to check file existence
async function exists(path: string) {
	try {
		await Deno.stat(path);
		return true;
	} catch (_) {
		return false;
	}
}

// Collect files to include
const includeFiles: string[] = [];

const candidates = [
	// scripts in new root location
	join(cwd, "deployment", "docker.sh"),
	join(cwd, "deployment", "server.sh"),
	// generated server installer (optional)
	join(outDir, "webspinner-server.sh"),
	join(outDir, "webspinner-server.sh.sha256"),
	// compose/docker
	join(cwd, "docker-compose.yml"),
	join(cwd, "Dockerfile"),
	// readmes (single README in deployments + top-level)
	join(cwd, "deployment", "README.md"),
	join(cwd, "README.md"),
];

for (const f of candidates) {
	if (await exists(f)) includeFiles.push(f);
}

if (includeFiles.length === 0) {
	console.error("No files to include. Did you run the server installer generator? (deployment/build-server.sh)");
	Deno.exit(1);
}

// Create a temp staging dir for nicer layout inside the zip
const staging = await Deno.makeTempDir();
const stackRoot = join(staging, `webspinner-stack-${version}`);
await Deno.mkdir(stackRoot, { recursive: true });

// Place scripts in /scripts inside the bundle
const scriptsDir = join(stackRoot, "scripts");
await Deno.mkdir(scriptsDir, { recursive: true });

const docsDir = join(stackRoot, "docs");
await Deno.mkdir(docsDir, { recursive: true });

for (const f of includeFiles) {
	const base = basename(f);
	if (
		base.endsWith(".sh") && (base.startsWith("webspinner-server") || base === "docker.sh" || base === "server.sh")
	) {
		await Deno.copyFile(f, join(scriptsDir, base));
	} else if (base.toLowerCase() === "readme.md") {
		// Put a README at the bundle root for immediate visibility
		await Deno.copyFile(f, join(stackRoot, base));
	} else if (base.endsWith(".md")) {
		await Deno.copyFile(f, join(docsDir, base));
	} else if (base === "docker-compose.yml" || base === "Dockerfile") {
		await Deno.copyFile(f, join(stackRoot, base));
	} else if (base.endsWith(".sha256")) {
		await Deno.copyFile(f, join(scriptsDir, base));
	} else {
		// default to root
		await Deno.copyFile(f, join(stackRoot, base));
	}
}

// Add a small stack README if not present
const stackReadme = join(stackRoot, "STACK-README.md");
await Deno.writeTextFile(
	stackReadme,
	`# Spin the Web — Deployment Stack\n\n` +
		`This bundle contains both Docker and Server installers.\n\n` +
		`Quick start:\n\n` +
		`Docker (app runtime in a container):\n` +
		`  bash ./scripts/docker.sh\n` +
		`  - Runs Spin the Web on port 8080 (mapped from host)\n` +
		`  - Persists data via host bind: ./webspinner-data -> /app/.data\n` +
		`  - Configurable via env (PORT, SITE_ROOT, SITE_WEBBASE, COMMON_WEBBASE, STUDIO_WEBBASE)\n` +
		`  - For TLS/reverse proxy and databases, pair with your Docker stack (nginx/Traefik/Caddy, PostgreSQL)\n\n` +
		`Linux server (nginx + certbot + PostgreSQL):\n` +
		`  sudo bash ./scripts/server.sh\n\n` +
		`If a self-extracting server installer is not included, the wrapper will fetch the latest release.\n`,
);

// Zip the stack
const zipName = `webspinner-stack-${version}.zip`;
const zipPath = join(outDir, zipName);

// Remove existing
try {
	await Deno.remove(zipPath);
} catch (_err) {
	// It's fine if the file didn't exist
}

const p = new Deno.Command("zip", {
	args: ["-r", zipPath, basename(stackRoot)],
	cwd: staging,
	stdout: "inherit",
	stderr: "inherit",
});
const { code } = await p.output();
if (code !== 0) {
	console.error("zip failed. Ensure 'zip' is installed.");
	Deno.exit(code);
}

// checksum
const shaPath = `${zipPath}.sha256`;
const sha = new Deno.Command("sha256sum", { args: [zipPath] });
const out = await sha.output();
if (out.code === 0) {
	await Deno.writeTextFile(shaPath, new TextDecoder().decode(out.stdout));
	console.log("Checksum written:", shaPath);
} else {
	console.warn("sha256sum not available or failed; skipping checksum");
}

console.log("Bundle created:", zipPath);

// Auto-bump patch in deno.json unless overridden with --version or disabled with --no-bump
async function bumpPatchInDenoJson() {
	try {
		const denoPath = join(cwd, "deno.json");
		const txt = await Deno.readTextFile(denoPath);
		const json = JSON.parse(txt);
		const cur = typeof json.version === "string" ? json.version : "0.0.0";
		const m = cur.match(/^(\d+)\.(\d+)\.(\d+)(.*)?$/);
		if (!m) return; // non-semver; skip
		const major = Number(m[1]);
		const minor = Number(m[2]);
		const patch = Number(m[3]) + 1;
		const rest = m[4] ?? ""; // preserve any suffix (unlikely per your workflow)
		const next = `${major}.${minor}.${patch}${rest}`;
		json.version = next;
		await Deno.writeTextFile(denoPath, JSON.stringify(json, null, 2) + "\n");
		console.log(`Version bumped in deno.json: ${cur} -> ${next}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.warn("Skipping version bump (error):", msg);
	}
}

if (!cliVersion && !getFlag("no-bump")) {
	await bumpPatchInDenoJson();
}
