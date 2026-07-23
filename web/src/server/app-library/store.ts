/**
 * On-disk store for the generated app library snapshot (under web/data/app-library/).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AppLibraryManifest, AppLibraryMetaFile, AppLibraryPack } from "./types";
import { APP_LIBRARY_SCHEMA_VERSION } from "./types";

export function appLibraryDir(cwd: string = process.cwd()): string {
  return join(cwd, "data", "app-library");
}

export function libraryJsonPath(cwd?: string): string {
  return join(appLibraryDir(cwd), "library.json");
}

export function metaJsonPath(cwd?: string): string {
  return join(appLibraryDir(cwd), "meta.json");
}

export function readMeta(cwd?: string): AppLibraryMetaFile | null {
  const p = metaJsonPath(cwd);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as AppLibraryMetaFile;
}

export function readPackBytes(cwd?: string): Buffer | null {
  const p = libraryJsonPath(cwd);
  if (!existsSync(p)) return null;
  return readFileSync(p);
}

export function readPack(cwd?: string): AppLibraryPack | null {
  const buf = readPackBytes(cwd);
  if (!buf) return null;
  return JSON.parse(buf.toString("utf8")) as AppLibraryPack;
}

export function packUrlPath(): string {
  // Production always mounts under /aulaChines. Default so local
  // `build:app-library` / API without NEXT_PUBLIC_BASE_PATH still match the app.
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/aulaChines").replace(
    /\/$/,
    "",
  );
  return `${base}/api/app/content/pack/library`;
}

export function buildManifestFromMeta(meta: AppLibraryMetaFile): AppLibraryManifest {
  return {
    schemaVersion: meta.schemaVersion,
    contentVersion: meta.contentVersion,
    generatedAt: meta.generatedAt,
    library: {
      byteSize: meta.byteSize,
      sha256: meta.sha256,
      url: meta.packUrl || packUrlPath(),
    },
  };
}

export function writeSnapshotArtifacts(
  pack: AppLibraryPack,
  fingerprint: string,
  sha256: string,
  bytes: Buffer,
  cwd?: string,
): AppLibraryMetaFile {
  const dir = appLibraryDir(cwd);
  mkdirSync(dir, { recursive: true });
  writeFileSync(libraryJsonPath(cwd), bytes);
  const meta: AppLibraryMetaFile = {
    schemaVersion: APP_LIBRARY_SCHEMA_VERSION,
    contentVersion: pack.meta.contentVersion,
    generatedAt: pack.meta.generatedAt,
    byteSize: bytes.byteLength,
    sha256,
    packUrl: packUrlPath(),
    contentFingerprint: fingerprint,
  };
  writeFileSync(metaJsonPath(cwd), `${JSON.stringify(meta, null, 2)}\n`);
  return meta;
}
