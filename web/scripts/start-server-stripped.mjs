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

/** Dynamic SSR HTML omits basePath on /_next/* ; static prerender already includes it. */
function prefixRootNextAssets(body, basePath) {
  if (!basePath || !body.includes('"/_next/')) return body;
  return body.replaceAll('"/_next/', `"${basePath}/_next/`);
}

/** Buffer HTML for dynamic routes so asset URLs get the public basePath prefix. */
function wrapResForBasePath(res, basePath) {
  const chunks = [];
  const origEnd = res.end.bind(res);

  res.write = (chunk, encoding, cb) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8"));
    }
    if (typeof encoding === "function") cb = encoding;
    if (cb) setImmediate(cb);
    return true;
  };

  res.end = (chunk, encoding, cb) => {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8"));
    }

    let out = chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
    const ct = res.getHeader("content-type");
    const ctStr = Array.isArray(ct) ? ct[0] : String(ct ?? "");

    if (ctStr.includes("text/html") && out.length > 0) {
      const text = out.toString("utf8");
      if (text.includes('"/_next/')) {
        out = Buffer.from(prefixRootNextAssets(text, basePath));
        res.setHeader("content-length", out.length);
      }
    }

    return origEnd(out, encoding, cb);
  };
}

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
    // Next emits trailing-slash redirects with Location relative to the host root; that drops
    // basePath in the browser (e.g. /aulaChines/foo/ → Location: /foo). Strip a single
    // trailing slash before handing off when `trailingSlash: false` in next.config.
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    }
    // Dynamic SSR HTML may omit basePath on /_next/* (static prerender already includes it).
    if (base && u.pathname === "/backoffice") {
      wrapResForBasePath(res, base);
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
