import playwright from "../QA/node_modules/@playwright/test/index.js";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const { chromium } = playwright;
const root = process.cwd();
const outDir = join(root, "appMobile/store/asc-creative");
mkdirSync(outDir, { recursive: true });

// Convert key image elements to Base64
const bgWatercolorB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/asc-creative/elements/bg_watercolor_5244x1590.png")).toString("base64")}`;
const bambooB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/asc-creative/elements/bamboo_branch.png")).toString("base64")}`;
const sealB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/asc-creative/elements/chinese_seal_stamp.png")).toString("base64")}`;
const appIconB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png")).toString("base64")}`;
const homeScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/02-home.png")).toString("base64")}`;
const phrasesScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/03-phrases.png")).toString("base64")}`;
const studyScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/05-study.png")).toString("base64")}`;

function getDeviceFrame(imgB64, w, h) {
  const radius = w * 0.14;
  return `
    <div style="width: ${w}px; height: ${h}px; border-radius: ${radius}px; background: linear-gradient(145deg, #2a2824, #141311); padding: 10px; box-shadow: 0 35px 80px rgba(50, 40, 30, 0.4), 0 10px 25px rgba(0,0,0,0.25); position: relative; display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
      <div style="position: absolute; top: 18px; width: ${w * 0.28}px; height: 22px; background: #000; border-radius: 20px; z-index: 10;"></div>
      <div style="width: 100%; height: 100%; border-radius: ${w * 0.12}px; overflow: hidden; background: #ffffff;">
        <img src="${imgB64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
    </div>
  `;
}

async function renderHeader(browser) {
  console.log("Generating App Store Header (3840 x 1646) with watercolor identity...");
  const page = await browser.newPage({ viewport: { width: 3840, height: 1646 } });

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
          background: #F6EFE3;
          font-family: -apple-system, "PingFang SC", "Songti SC", "Playfair Display", serif;
        }
        .serif-title {
          font-family: "Songti SC", "Playfair Display", "Times New Roman", serif;
          font-size: 154px;
          color: #1A1916;
          font-weight: 500;
          letter-spacing: -1px;
          line-height: 1;
        }
      </style>
    </head>
    <body>
      <!-- Top Watercolor Canvas -->
      <div style="position: absolute; top: 0; left: 0; width: 3840px; height: 1280px; overflow: hidden;">
        <img src="${bgWatercolorB64}" style="width: 4200px; height: auto; position: absolute; top: -60px; left: -100px; object-fit: cover;" />
      </div>

      <!-- Bamboo foliage overlay top right -->
      <div style="position: absolute; top: 0; right: 0; width: 1100px; height: 950px; pointer-events: none; z-index: 5;">
        <img src="${bambooB64}" style="width: 100%; height: 100%; object-fit: contain; object-position: top right;" />
      </div>

      <!-- Center-Left Typography & Branding Cluster -->
      <div style="position: absolute; left: 240px; top: 140px; z-index: 10; max-width: 1900px;">
        <!-- Sumi-e Calligraphy text watermark -->
        <div style="font-size: 260px; font-weight: 900; color: rgba(50, 45, 40, 0.42); font-family: 'Songti SC', 'Kaiti SC', serif; letter-spacing: 24px; line-height: 0.9; margin-bottom: 20px;">
          学中文
        </div>

        <!-- Master Title -->
        <h1 class="serif-title">
          LearnChinese Today
        </h1>

        <!-- Red Line Divider with Centered Dot -->
        <div style="display: flex; align-items: center; gap: 24px; width: 1480px; margin: 38px 0 32px 0;">
          <div style="flex: 1; height: 2px; background: #B8332A;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #B8332A;"></div>
          <div style="flex: 1; height: 2px; background: #B8332A;"></div>
        </div>

        <!-- Subtitle & Features -->
        <div style="display: flex; align-items: center; gap: 36px;">
          <div style="font-family: -apple-system, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #3A352E; text-transform: uppercase;">
            MANDARIN LEARNING APP
          </div>
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #8C8272;"></div>
          <div style="font-family: -apple-system, sans-serif; font-size: 26px; color: #6E6556; font-weight: 600; letter-spacing: 2px;">
            HSK 1-3 • PHRASE GAME • WIDGETS
          </div>
        </div>
      </div>

      <!-- Seal Stamp in lower right of watercolor section -->
      <div style="position: absolute; top: 960px; left: 1560px; z-index: 12;">
        <img src="${sealB64}" style="width: 180px; height: 180px; border-radius: 8px; box-shadow: 0 10px 25px rgba(184, 51, 42, 0.3);" />
      </div>

      <!-- Right Device Showcase (Home & Study iPhone) -->
      <div style="position: absolute; right: 220px; top: 110px; display: flex; align-items: center; gap: 36px; z-index: 10;">
        <div style="transform: translateY(40px) scale(0.92); z-index: 8;">
          ${getDeviceFrame(phrasesScreenB64, 460, 990)}
        </div>
        <div style="transform: scale(1.04); z-index: 12;">
          ${getDeviceFrame(homeScreenB64, 500, 1070)}
        </div>
      </div>

      <!-- Bottom Dark Charcoal Band -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 366px; background: #141311; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 20; border-top: 1px solid rgba(255,255,255,0.06);">
        <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 68px; font-weight: 700; color: #FFFFFF; letter-spacing: -1px; margin-bottom: 12px;">
          LearnChinese Today
        </h2>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 34px; color: rgba(255, 255, 255, 0.75); font-weight: 400; letter-spacing: 0.5px;">
          Learn Mandarin · free
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(400);
  const outPath = join(outDir, "header-3840x1646.png");
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`Saved Header PNG: ${outPath}`);
}

async function renderSearch(browser) {
  console.log("Generating App Store Search Result (3840 x 2560) with watercolor identity...");
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
          background: #F6EFE3;
          font-family: -apple-system, "PingFang SC", "Songti SC", "Playfair Display", serif;
        }
        .serif-title {
          font-family: "Songti SC", "Playfair Display", "Times New Roman", serif;
          font-size: 172px;
          color: #1A1916;
          font-weight: 500;
          letter-spacing: -1.5px;
          line-height: 1;
        }
      </style>
    </head>
    <body>
      <!-- Top Watercolor Canvas -->
      <div style="position: absolute; top: 0; left: 0; width: 3840px; height: 1880px; overflow: hidden;">
        <img src="${bgWatercolorB64}" style="width: 4400px; height: auto; position: absolute; top: -60px; left: -100px; object-fit: cover;" />
      </div>

      <!-- Bamboo foliage overlay top right -->
      <div style="position: absolute; top: 0; right: 0; width: 1300px; height: 1100px; pointer-events: none; z-index: 5;">
        <img src="${bambooB64}" style="width: 100%; height: 100%; object-fit: contain; object-position: top right;" />
      </div>

      <!-- Top Branding Section -->
      <div style="position: absolute; left: 240px; top: 120px; z-index: 10; max-width: 2200px;">
        <div style="font-size: 280px; font-weight: 900; color: rgba(50, 45, 40, 0.42); font-family: 'Songti SC', 'Kaiti SC', serif; letter-spacing: 24px; line-height: 0.9; margin-bottom: 24px;">
          学中文
        </div>

        <h1 class="serif-title">
          LearnChinese Today
        </h1>

        <div style="display: flex; align-items: center; gap: 24px; width: 1650px; margin: 40px 0 34px 0;">
          <div style="flex: 1; height: 2px; background: #B8332A;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #B8332A;"></div>
          <div style="flex: 1; height: 2px; background: #B8332A;"></div>
        </div>

        <div style="display: flex; align-items: center; gap: 36px;">
          <div style="font-family: -apple-system, sans-serif; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #3A352E; text-transform: uppercase;">
            MANDARIN LEARNING APP
          </div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #8C8272;"></div>
          <div style="font-family: -apple-system, sans-serif; font-size: 30px; color: #6E6556; font-weight: 600; letter-spacing: 2px;">
            HSK 1-3 • PHRASE GAME • WIDGETS
          </div>
        </div>
      </div>

      <!-- Seal Stamp -->
      <div style="position: absolute; top: 1400px; left: 1680px; z-index: 12;">
        <img src="${sealB64}" style="width: 210px; height: 210px; border-radius: 10px; box-shadow: 0 12px 30px rgba(184, 51, 42, 0.32);" />
      </div>

      <!-- Right Devices Showcase (Home, Phrases, Study) -->
      <div style="position: absolute; right: 240px; top: 380px; display: flex; align-items: center; gap: 40px; z-index: 10;">
        <div style="transform: translateY(50px) scale(0.92); z-index: 8;">
          ${getDeviceFrame(phrasesScreenB64, 520, 1120)}
        </div>
        <div style="transform: scale(1.06); z-index: 12;">
          ${getDeviceFrame(homeScreenB64, 580, 1250)}
        </div>
        <div style="transform: translateY(50px) scale(0.92); z-index: 8;">
          ${getDeviceFrame(studyScreenB64, 520, 1120)}
        </div>
      </div>

      <!-- Bottom Dark Charcoal Band -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 520px; background: #141311; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 20; border-top: 1px solid rgba(255,255,255,0.06);">
        <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-size: 82px; font-weight: 700; color: #FFFFFF; letter-spacing: -1.5px; margin-bottom: 16px;">
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
  const outPath = join(outDir, "search-3840x2560.png");
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`Saved Search PNG: ${outPath}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await renderHeader(browser);
  await renderSearch(browser);
  await browser.close();
  console.log("All watercolor static creative rendered successfully!");
})().catch(e => {
  console.error("Error rendering watercolor creative:", e);
  process.exit(1);
});
