#!/usr/bin/env node
/**
 * Production server for builds with `basePath`: browsers use `/aulaChines/...` but the stock
 * `next start` handler was matching only unprefixed paths (`/review`, `/_next/static/...`).
 * Strip the base path on the Node request before delegating to Next.
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath, parse } from "node:url";
import next from "next";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

function basePathFromBuild() {
  const env = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  if (env) return env;
  try {
    const rf = JSON.parse(
      readFileSync(join(webRoot, ".next/required-server-files.json"), "utf8"),
    );
    return (rf.config?.basePath || "").replace(/\/$/, "") || "";
  } catch {
    return "";
  }
}

const dev = false;
const hostname = process.env.HOSTNAME || "127.0.0.1";
const port = Number.parseInt(process.env.PORT || "34827", 10);
const base = basePathFromBuild();

const app = next({ dev, hostname, port, dir: webRoot });
const handle = app.getRequestHandler();

await app.prepare();

createServer(async (req, res) => {
  try {
    const host = req.headers.host || `${hostname}:${port}`;
    const u = new URL(req.url || "/", `http://${host}`);
    if (base) {
      const p = u.pathname;
      if (p === base) {
        u.pathname = "/";
      } else if (p.startsWith(`${base}/`)) {
        u.pathname = p.slice(base.length) || "/";
      }
    }
    req.url = u.pathname + u.search;
    await handle(req, res, parse(req.url, true));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}).listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port} (basePath strip: ${base || "none"})`);
});
