/**
 * STW Studio is a REST API for managing files in the public folder of the web application.
 * It allows to create, read, update, and delete files, as well as manage directories.
 *
 * @module stwStudio
 * @author Giancarlo Trevisan
 * @license MIT
 * @version 1.0.0
 */
import { serveFile } from "@std/http/file-server";

async function listDirRecursive(dir: string, base = ""): Promise<any[]> {
  const entries: any[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${entry.name}`;
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      entries.push({
        name: entry.name,
        path: relPath,
        type: "directory",
        children: await listDirRecursive(fullPath, relPath)
      });
    } else {
      entries.push({
        name: entry.name,
        path: relPath,
        type: "file"
      });
    }
  }
  return entries;
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let path = decodeURIComponent(url.pathname.replace(/^\/api\/public\/?/, ""));
  if (path.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }
  const fsPath = path ? `./public/${path}` : "./public";
  try {
    const stat = await Deno.stat(fsPath);
    if (stat.isDirectory) {
      // Recursively list directory contents
      const entries = await listDirRecursive(fsPath, path);
      return new Response(JSON.stringify(entries), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // Serve file
      return await serveFile(req, fsPath);
    }
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
