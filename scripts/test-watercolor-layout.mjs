import playwright from "../QA/node_modules/@playwright/test/index.js";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const { chromium } = playwright;
const root = process.cwd();
const outDir = join(root, "appMobile/store/asc-creative/elements");
mkdirSync(outDir, { recursive: true });

const bgWatercolorB64 = `data:image/png;base64,${readFileSync(join(outDir, "bg_watercolor_5244x1590.png")).toString("base64")}`;
const bambooB64 = `data:image/png;base64,${readFileSync(join(outDir, "bamboo_branch.png")).toString("base64")}`;
const sealB64 = `data:image/png;base64,${readFileSync(join(outDir, "chinese_seal_stamp.png")).toString("base64")}`;
const homeScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/02-home.png")).toString("base64")}`;
const phrasesScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/03-phrases.png")).toString("base64")}`;

async function testVerticalReel() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1080px;
          height: 1920px;
          position: relative;
          overflow: hidden;
          background: #F4EEE2;
          font-family: -apple-system, "PingFang SC", "Songti SC", "Playfair Display", serif;
          color: #1A1916;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: space-between;
          padding: 80px 60px 100px 60px;
        }
      </style>
    </head>
    <body>
      <!-- Watercolor texture background scaled to vertical -->
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1;">
        <!-- Base rice paper gradient -->
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 60% 25%, #FBF7EE 0%, #F3ECE0 60%, #E9DFC9 100%);"></div>
        
        <!-- Mountains & wash at the bottom -->
        <img src="${bgWatercolorB64}" style="position: absolute; bottom: -50px; left: -800px; width: 2800px; height: auto; opacity: 0.85; mix-blend-mode: multiply;" />

        <!-- Bamboo foliage on top right -->
        <img src="${bambooB64}" style="position: absolute; top: -20px; right: -50px; width: 620px; height: auto; mix-blend-mode: multiply; opacity: 0.9;" />
      </div>

      <!-- HEADER SECTION -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10; margin-top: 20px;">
        <!-- App Title in Master Serif -->
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 20px;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-family: 'Songti SC', 'Playfair Display', serif; font-size: 42px; font-weight: 600; color: #1C1B18; letter-spacing: -0.5px;">
              LearnChinese Today
            </span>
            <span style="font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 3px; color: #8A7E6C; text-transform: uppercase; margin-top: 4px;">
              Mandarin Learning App
            </span>
          </div>

          <!-- Official Red Seal Stamp -->
          <img src="${sealB64}" style="width: 64px; height: 64px; border-radius: 6px; box-shadow: 0 4px 12px rgba(184, 51, 42, 0.25);" />
        </div>

        <!-- Red Divider line with center dot -->
        <div style="display: flex; align-items: center; gap: 14px; width: 100%; margin: 24px 0 0 0;">
          <div style="flex: 1; height: 1.5px; background: #B8332A; opacity: 0.7;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #B8332A;"></div>
          <div style="flex: 1; height: 1.5px; background: #B8332A; opacity: 0.7;"></div>
        </div>
      </div>

      <!-- MAIN CONTENT: Headline + Clean Ivory Card / Device -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; z-index: 10; margin: 30px 0;">
        <div style="font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 800; color: #B8332A; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">
          Active Practice • 每日练习
        </div>
        
        <h1 style="font-family: 'Songti SC', 'Playfair Display', serif; font-size: 58px; font-weight: 600; color: #1C1B18; line-height: 1.15; letter-spacing: -1px; margin-bottom: 36px;">
          Practice Real Sentences
        </h1>

        <!-- Phone Mockup with natural shadow -->
        <div style="width: 440px; height: 920px; border-radius: 56px; background: #1C1B18; padding: 10px; box-shadow: 0 35px 80px rgba(70, 50, 30, 0.25), 0 10px 25px rgba(0,0,0,0.15); position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="position: absolute; top: 18px; width: 120px; height: 24px; background: #000; border-radius: 20px; z-index: 10;"></div>
          <div style="width: 100%; height: 100%; border-radius: 48px; overflow: hidden; background: #fff;">
            <img src="${phrasesScreenB64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
          </div>
        </div>
      </div>

      <!-- FOOTER / CTA BAR -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 12px; background: rgba(184, 51, 42, 0.08); border: 1px solid rgba(184, 51, 42, 0.25); padding: 14px 28px; border-radius: 30px; margin-bottom: 24px;">
          <span style="font-size: 20px;">✨</span>
          <span style="font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 700; color: #8A251E;">
            Immediate audio & grammar validation
          </span>
        </div>

        <div style="width: 100%; max-width: 680px; padding: 22px 0; border-radius: 36px; background: #B8332A; color: #FFFFFF; font-family: -apple-system, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-align: center; box-shadow: 0 15px 35px rgba(184, 51, 42, 0.35);">
          Download on App Store
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(400);
  const outPath = "/Users/ianthomaz/.gemini/antigravity/brain/e836f067-f2c1-4bdb-8f0d-e8e0d50fd17b/test_watercolor_reel.jpg";
  await page.screenshot({ path: outPath, type: "jpeg", quality: 90 });
  await browser.close();
  console.log("Saved test watercolor reel to", outPath);
}

testVerticalReel().catch(e => console.error(e));
