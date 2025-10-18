// tasks/release.ts - Build a single deployment stack bundle
// deno run --allow-read --allow-write --allow-run tasks/release.ts [--version vX.Y.Z]

// Minimal bundle producer
// Contents:
// Release producer: outputs two precise artifacts under deployment/release/
//   - server-<version>.zip (+ .sha256)
//   - docker-<version>.zip (+ .sha256)
// GitHub release will also show Source code (zip/tar.gz) from the tag.

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

// dirname helper no longer needed in current flow

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
const doPublish = Deno.args.includes("--publish") || Deno.args.includes("--git") || Deno.args.includes("--gh") || Deno.args.includes("--docker");
const skipGitTag = Deno.args.includes("--no-git-tag");
const doGit = Deno.args.includes("--publish") || Deno.args.includes("--git");
const doGh = Deno.args.includes("--publish") || Deno.args.includes("--gh");
const dockerUseBuildx = Deno.args.includes("--docker-buildx") || Deno.args.includes("--docker-multi-arch");
const dockerRepoArg = getArg("docker-repo");
const dryRun = Deno.args.includes("--dry-run");

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

// (zip packaging removed; release attaches standalone scripts + checksums)

async function sha256File(file: string): Promise<string | null> {
	const c = new Deno.Command("sha256sum", { args: [file] });
	const out = await c.output();
	if (out.code === 0) {
		const shaPath = `${file}.sha256`;
		await Deno.writeTextFile(shaPath, new TextDecoder().decode(out.stdout));
		console.log("Checksum written:", shaPath);
		return shaPath;
	} else {
		console.warn("sha256sum not available or failed; skipping checksum for", file);
		return null;
	}
}

// Always (re)build the server installer for each release
const serverInstallerOut = join(outDir, "server.sh");
console.log("Generating server installer (non-interactive)...");
try {
	try { await Deno.remove(serverInstallerOut); } catch { /* ignore */ }
	const gen = new Deno.Command("bash", { args: ["-lc", "./deployment/build-server.sh --non-interactive"], cwd });
	const res = await gen.output();
	if (res.code !== 0) {
		console.warn("Server installer generation failed; continuing without server.sh asset.");
	}
} catch (_e) {
	console.warn("Failed to invoke server installer generator; continuing without server.sh asset.");
}

// Prepare standalone installer scripts as release assets
// 1) server.sh (already generated above) -> ensure checksum
await sha256File(serverInstallerOut);

// 2) docker.sh -> copy into release dir and checksum
const dockerScriptSrc = join(cwd, "deployment", "docker.sh");
const dockerScriptOut = join(outDir, "docker.sh");
if (await exists(dockerScriptSrc)) {
	await Deno.copyFile(dockerScriptSrc, dockerScriptOut);
	await sha256File(dockerScriptOut);
	console.log("Docker script prepared:", dockerScriptOut);
} else {
	console.warn("deployment/docker.sh not found; Docker script will not be attached to the release.");
}

// ready for gh assets

// Auto-bump patch in deno.json unless overridden with --version or disabled with --no-bump
async function bumpPatchInDenoJson(): Promise<string | null> {
	try {
		const denoPath = join(cwd, "deno.json");
		const txt = await Deno.readTextFile(denoPath);
		const json = JSON.parse(txt);
		const cur = typeof json.version === "string" ? json.version : "0.0.0";
		const m = cur.match(/^(\d+)\.(\d+)\.(\d+)(.*)?$/);
		if (!m) return null; // non-semver; skip
		const major = Number(m[1]);
		const minor = Number(m[2]);
		const patch = Number(m[3]) + 1;
		const rest = m[4] ?? ""; // preserve any suffix (unlikely per your workflow)
		const next = `${major}.${minor}.${patch}${rest}`;
		json.version = next;
		await Deno.writeTextFile(denoPath, JSON.stringify(json, null, 2) + "\n");
		console.log(`Version bumped in deno.json: ${cur} -> ${next}`);
		return next;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.warn("Skipping version bump (error):", msg);
		return null;
	}
}

let bumpedTo: string | null = null;
if (!cliVersion && !getFlag("no-bump") && !dryRun) {
	bumpedTo = await bumpPatchInDenoJson();
}

// --- Optional: publish to GitHub (git tag/push + gh release) ---
async function commandExists(cmd: string): Promise<boolean> {
	try {
		const p = new Deno.Command(cmd, { args: ["--version"], stdin: "null", stdout: "piped", stderr: "piped" });
		await p.output();
		return true;
	} catch (_err) {
		return false;
	}
}

async function run(cmd: string, args: string[], opts?: { cwd?: string; allowFail?: boolean }): Promise<{ code: number; out: string; err: string }> {
	const p = new Deno.Command(cmd, { args, cwd: opts?.cwd ?? cwd, stdin: "null", stdout: "piped", stderr: "piped" });
	const res = await p.output();
	return { code: res.code, out: new TextDecoder().decode(res.stdout).trim(), err: new TextDecoder().decode(res.stderr).trim() };
}

// --- Optional: Docker image build + push ---
function sanitizeDockerTag(t: string): string {
	// remove leading v, restrict to allowed chars
	const noV = t.replace(/^v/, "");
	return noV.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

let dockerNotesSection = "";

async function dockerExists(): Promise<boolean> {
	try {
		const r = await run("docker", ["version", "--format", "{{.Client.Version}}"]);
		return r.code === 0;
	} catch {
		return false;
	}
}

async function publishDockerImage() {
	if (!(await dockerExists())) {
		console.warn("docker not found; skipping Docker image build/push");
		return;
	}
	const repo = dockerRepoArg ?? "spintheweb/webspinner";
	const tagV = version; // e.g. v0.3.3
	const tagSemver = sanitizeDockerTag(version); // e.g. 0.3.3
	const tags = ["latest", tagV, tagSemver];

	const buildTagsArgs: string[] = [];
	for (const t of tags) buildTagsArgs.push("-t", `${repo}:${t}`);

	if (dockerUseBuildx) {
		// Multi-arch buildx build and push directly
		const args = ["buildx", "build", "--platform", "linux/amd64,linux/arm64", ...buildTagsArgs, "--push", "."];
		if (!dryRun) {
			const r = await run("docker", args);
			if (r.code !== 0) console.warn("docker buildx build failed:", r.err || r.out);
		} else {
			console.log(`[dry-run] docker ${args.join(" ")}`);
		}
	} else {
		// Single-arch local build then push tags individually
		const args = ["build", ...buildTagsArgs, "."];
		if (!dryRun) {
			const r = await run("docker", args);
			if (r.code !== 0) console.warn("docker build failed:", r.err || r.out);
		} else {
			console.log(`[dry-run] docker ${args.join(" ")}`);
		}
		for (const t of tags) {
			if (!dryRun) {
				const p = await run("docker", ["push", `${repo}:${t}`]);
				if (p.code !== 0) console.warn(`docker push ${repo}:${t} failed:`, p.err || p.out);
			} else {
				console.log(`[dry-run] docker push ${repo}:${t}`);
			}
		}
	}

	// Release notes block for Docker
	dockerNotesSection = [
		"\nDocker images:",
		`- ${repo}:latest`,
		`- ${repo}:${tagV}`,
		`- ${repo}:${tagSemver}`,
		"\nPull examples:",
		`docker pull ${repo}:${tagV}`,
		`docker pull ${repo}:${tagSemver}`,
		`docker pull ${repo}:latest\n`,
	].join("\n");
}

async function publishGitAndGithub() {
	const tag = version; // Tag the bundled version (vX.Y.Z)
	if (doGit && !skipGitTag) {
		if (!(await commandExists("git"))) {
			console.warn("git not found; skipping git publish");
		} else {
			// Ensure we're in a repo
			const chk = await run("git", ["rev-parse", "--is-inside-work-tree"]);
			if (chk.code !== 0 || chk.out !== "true") {
				console.warn("Not inside a git repository; skipping git publish");
			} else {
				// Stage and commit deno.json if it changed (common when auto-bumping)
				if (bumpedTo) {
					console.log(`Committing version bump: ${bumpedTo}`);
					if (!dryRun) {
						await run("git", ["add", "deno.json"]);
						await run("git", ["commit", "-m", `chore(release): bundle ${tag} and bump to ${bumpedTo}`]);
					} else {
						console.log(`[dry-run] git add deno.json && git commit -m "chore(release): bundle ${tag} and bump to ${bumpedTo}"`);
					}
				}
				// Create tag if not exists
				const hasTag = await run("git", ["tag", "-l", tag]);
				if (!hasTag.out.split(/\r?\n/).includes(tag)) {
					console.log(`Creating git tag ${tag}`);
					if (!dryRun) await run("git", ["tag", "-a", tag, "-m", `Release ${tag}`]);
					else console.log(`[dry-run] git tag -a ${tag} -m "Release ${tag}"`);
				} else {
					console.log(`Tag ${tag} already exists locally`);
				}
				// Push commit(s) and only the current tag (avoid re-pushing all local tags)
				if (!dryRun) {
					await run("git", ["push"]);
					await run("git", ["push", "origin", tag]);
				} else {
					console.log(`[dry-run] git push && git push origin ${tag}`);
				}
			}
		}
	}

	if (doGh) {
		if (!(await commandExists("gh"))) {
			console.warn("GitHub CLI (gh) not found; skipping GitHub release");
			return;
		}
		// Build asset list: standalone scripts (server.sh, docker.sh) and their checksums
		const assets: string[] = [];
		const serverShPath = join(outDir, "server.sh");
		const serverShShaPath = `${serverShPath}.sha256`;
		const dockerShPath = join(outDir, "docker.sh");
		const dockerShShaPath = `${dockerShPath}.sha256`;
		if (await exists(serverShPath)) assets.push(serverShPath);
		if (await exists(serverShShaPath)) assets.push(serverShShaPath);
		if (await exists(dockerShPath)) assets.push(dockerShPath);
		if (await exists(dockerShShaPath)) assets.push(dockerShShaPath);
		// Source code archives are attached automatically by GitHub for the tag

		const title = `Webspinner ${tag}`;
		const notes = [
			`Release ${tag}`,
			`\nIncluded assets:`,
			(await exists(serverShPath) ? `- ${basename(serverShPath)} (+ .sha256)` : null),
			(await exists(dockerShPath) ? `- ${basename(dockerShPath)} (+ .sha256)` : null),
			`\nHow to use on the destination server:`,
			`1) Linux server install:`,
			`   Download ${basename(serverShPath)} and run:`,
			`   \`\`\`sudo bash ${basename(serverShPath)}\`\`\``,
			`   (sudo is required to install packages/services)`,
			`2) Docker setup:`,
			`   Download ${basename(dockerShPath)} and run:`,
			`   \`\`\`bash ${basename(dockerShPath)}\`\`\``,
			`   - Maps host 8080 -> container 8080`,
			`   - Persists data: ./webspinner-data -> /app/.data`,
			`   - Env: PORT, SITE_ROOT, WEBBASE, COMMON_WEBBASE, STUDIO_WEBBASE`,
			`3) (Optional) Verify checksums: use the .sha256 files next to each script\n`,
			dockerNotesSection || null,
		].filter(Boolean).join("\n");

		const args = ["release", "create", tag, ...assets, "--title", title, "--notes", notes];
		if (!dryRun) {
			const r = await run("gh", args);
			if (r.code !== 0) {
				const msg = r.err || r.out;
				console.warn("gh release create failed:", msg);
				if (/already exists/i.test(msg)) {
					// Fallback: update existing release assets and notes
					console.log("Release exists; uploading assets and updating notes...");
					const upload = await run("gh", ["release", "upload", tag, ...assets, "--clobber"]);
					if (upload.code !== 0) console.warn("gh release upload failed:", upload.err || upload.out);
					const edit = await run("gh", ["release", "edit", tag, "--title", title, "--notes", notes]);
					if (edit.code !== 0) console.warn("gh release edit failed:", edit.err || edit.out);
				}
			} else {
				console.log("GitHub release created for", tag);
			}
		} else {
			console.log(`[dry-run] gh ${args.join(" ")}`);
		}
	}
}

if (doPublish) {
	if (Deno.args.includes("--publish") || Deno.args.includes("--docker")) {
		await publishDockerImage();
	}
	await publishGitAndGithub();

	// Cleanup: remove local release artifacts after publishing
	if (!dryRun) {
		try {
			await Deno.remove(outDir, { recursive: true });
			console.log("Cleaned release artifacts:", outDir);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			console.warn("Cleanup failed for", outDir, "-", msg);
		}
	} else {
		console.log("[dry-run] Skipping cleanup of", outDir);
	}
}
