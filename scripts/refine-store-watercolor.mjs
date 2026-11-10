import playwright from "../QA/node_modules/@playwright/test/index.js";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const { chromium } = playwright;
const root = process.cwd();
const ascDir = join(root, "appMobile/store/asc-creative");
const audioDir = join(root, "appMobile/store/audio");

// Base64 assets
const universalB64 = `data:image/png;base64,${readFileSync(join(ascDir, "universal-5244x2950.png")).toString("base64")}`;
const homeScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/02-home.png")).toString("base64")}`;
const phrasesScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/03-phrases.png")).toString("base64")}`;
const studyScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/05-study.png")).toString("base64")}`;

function getDevice(imgB64, w, h) {
  const r = w * 0.135;
  return `
    <div style="width: ${w}px; height: ${h}px; border-radius: ${r}px; background: #1C1B18; padding: 10px; box-shadow: 0 40px 90px rgba(60, 45, 30, 0.35), 0 10px 25px rgba(0,0,0,0.2); position: relative; display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
      <div style="position: absolute; top: 18px; width: ${w * 0.28}px; height: 22px; background: #000; border-radius: 20px; z-index: 10;"></div>
      <div style="width: 100%; height: 100%; border-radius: ${w * 0.115}px; overflow: hidden; background: #ffffff;">
        <img src="${imgB64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
    </div>
  `;
}

async function buildHeader(browser) {
  console.log("Generating pristine header-3840x1646.png...");
  const page = await browser.newPage({ viewport: { width: 3840, height: 1646 } });

  // In universal-5244x2950, watercolor is top ~55% and black band is bottom ~45%
  // In 3840x1646: we show the master universal artwork scaled perfectly with app showcase phones
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 3840px;
          height: 1646px;
          position: relative;
          overflow: hidden;
          background: #141311;
        }
      </style>
    </head>
    <body>
      <!-- Master Universal Artwork Background -->
      <img src="${universalB64}" style="position: absolute; top: 0; left: 0; width: 3840px; height: 2160px; object-fit: cover; object-position: top center;" />

      <!-- Natural device integration sitting between title and bamboo -->
      <div style="position: absolute; right: 260px; top: 80px; display: flex; align-items: center; gap: 40px; z-index: 15;">
        <div style="transform: translateY(40px) scale(0.92); z-index: 8;">
          ${getDevice(phrasesScreenB64, 460, 990)}
        </div>
        <div style="transform: scale(1.05); z-index: 12;">
          ${getDevice(homeScreenB64, 510, 1090)}
        </div>
      </div>

      <!-- Bottom Dark Banner overlay ensuring clean label -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 500px; background: #141311; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 20; border-top: 1px solid rgba(255,255,255,0.06);">
        <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 72px; font-weight: 700; color: #FFFFFF; letter-spacing: -1px; margin-bottom: 12px;">
          LearnChinese Today
        </h2>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 36px; color: rgba(255, 255, 255, 0.75); font-weight: 400; letter-spacing: 0.5px;">
          Learn Mandarin · free
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(400);
  const outPath = join(ascDir, "header-3840x1646.png");
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log("Saved Header PNG:", outPath);
}

async function buildSearch(browser) {
  console.log("Generating pristine search-3840x2560.png...");
  const page = await browser.newPage({ viewport: { width: 3840, height: 2560 } });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 3840px;
          height: 2560px;
          position: relative;
          overflow: hidden;
          background: #141311;
        }
      </style>
    </head>
    <body>
      <!-- Master Universal Artwork Background -->
      <img src="${universalB64}" style="position: absolute; top: 0; left: 0; width: 3840px; height: auto; object-fit: cover; object-position: top center;" />

      <!-- Center-Right 3-Device Carousel showcasing features -->
      <div style="position: absolute; right: 220px; top: 380px; display: flex; align-items: center; gap: 36px; z-index: 15;">
        <div style="transform: translateY(50px) scale(0.92); z-index: 8;">
          ${getDevice(phrasesScreenB64, 480, 1040)}
        </div>
        <div style="transform: scale(1.06); z-index: 12;">
          ${getDevice(homeScreenB64, 530, 1140)}
        </div>
        <div style="transform: translateY(50px) scale(0.92); z-index: 8;">
          ${getDevice(studyScreenB64, 480, 1040)}
        </div>
      </div>

      <!-- Bottom Dark Banner covering full black region cleanly -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 1100px; background: #141311; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 20; border-top: 1px solid rgba(255,255,255,0.06);">
        <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 88px; font-weight: 700; color: #FFFFFF; letter-spacing: -1.5px; margin-bottom: 20px;">
          LearnChinese Today
        </h2>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 42px; color: rgba(255, 255, 255, 0.75); font-weight: 400; letter-spacing: 1px;">
          Phrases · Hanzi · Widget
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(400);
  const outPath = join(ascDir, "search-3840x2560.png");
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log("Saved Search PNG:", outPath);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await buildHeader(browser);
  await buildSearch(browser);
  await browser.close();

  // Re-encode animated MP4 versions of header and search
  console.log("Re-rendering animated MP4 for header & search...");
  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", join(ascDir, "header-3840x1646.png"),
    "-i", join(audioDir, "store_ambient_header.mp3"),
    "-t", "10",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    join(ascDir, "header-3840x1646.mp4")
  ]);

  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", join(ascDir, "search-3840x2560.png"),
    "-i", join(audioDir, "store_ambient_header.mp3"),
    "-t", "10",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    join(ascDir, "search-3840x2560.mp4")
  ]);

  console.log("Header and Search assets 100% refreshed!");
})().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
