/**
 * Generates solid-color PNG icons for the PWA (requires devDependency `pngjs`).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public", "icons");

function solidPng(size, r, g, b) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

mkdirSync(publicDir, { recursive: true });
const r = 0x2d;
const g = 0x5a;
const b = 0x8c;
writeFileSync(join(publicDir, "icon-192.png"), solidPng(192, r, g, b));
writeFileSync(join(publicDir, "icon-512.png"), solidPng(512, r, g, b));
writeFileSync(join(publicDir, "apple-touch-icon.png"), solidPng(180, r, g, b));
console.log("Wrote public/icons/*.png");
