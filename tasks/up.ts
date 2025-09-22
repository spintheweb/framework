// Run the dev server and surface a shareable URL in Codespaces.
// Usage: deno task up

const env = Deno.env.toObject();
const port = env.PORT ?? "8080";
const host = env.HOST ?? "0.0.0.0"; // listen on all interfaces (needed in Codespaces)

const inCodespaces = !!env.CODESPACES;
if (inCodespaces) {
	const name = env.CODESPACE_NAME ?? "codespace";
	const domain = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "githubpreview.dev";
	// Common URL pattern for Codespaces forwarded ports
	const url1 = `https://${port}-${name}.${domain}`;
	// Alternate pattern seen in some environments
	const url2 = `https://${name}-${port}.${domain}`;
	console.log("\nCodespaces public URL (when port forwards):\n  ", url1);
	console.log("If that doesn't open automatically, also try:\n  ", url2, "\n");
} else {
	console.log(`\nLocal URL:  http://localhost:${port}\n`);
}

console.log("Starting dev server... (Ctrl+C to stop)\n");

const p = new Deno.Command("deno", {
	args: [
		"run",
		"--watch",
		"--allow-net",
		"--allow-read",
		"--allow-env",
		"stwSpinner.ts",
	],
	stdin: "inherit",
	stdout: "inherit",
	stderr: "inherit",
	env: {
		...env,
		HOST: host,
		PORT: port,
	},
});

const { code } = await p.output();
Deno.exit(code);
