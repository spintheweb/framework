// SPDX-License-Identifier: MIT
// Spin the Web component: stwStudio

import { serveFile } from "@std/http/file-server";
import { secureResponse } from "./stwResponse.ts";

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
  const path = decodeURIComponent(url.pathname.replace(/^\/api\/public\/?/, ""));
  if (path.includes("..")) {
    return secureResponse("Forbidden", { status: 403 });
  }
  const fsPath = path ? `./public/${path}` : "./public";
  try {
    const stat = await Deno.stat(fsPath);
    if (stat.isDirectory) {
      // Recursively list directory contents
      const entries = await listDirRecursive(fsPath, path);
      return secureResponse(JSON.stringify(entries), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // Serve file
      return await serveFile(req, fsPath);
    }
  } catch {
    return secureResponse("Not found", { status: 404 });
  }
}
