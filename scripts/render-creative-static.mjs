import playwright from "../QA/node_modules/@playwright/test/index.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const { chromium } = playwright;

const root = process.cwd();
const outDir = join(root, "appMobile/store/asc-creative");
mkdirSync(outDir, { recursive: true });

// Read screenshots and icons as base64 for embedding directly
const appIconB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png")).toString("base64")}`;
const homeScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/02-home.png")).toString("base64")}`;
const phrasesScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/03-phrases.png")).toString("base64")}`;
const studyScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/05-study.png")).toString("base64")}`;

// Stroke paths for '学'
const xueStrokes = [
  "M366 845 c-19 -42 -35 -83 -49 -124 c-7 -20 -15 -21 -31 -5 c-20 20 -44 38 -68 53 c-16 10 -25 9 -32 -9 c-17 -44 -38 -87 -63 -128 c-9 -15 -5 -27 12 -33 c35 -12 71 -19 108 -21 c112 -7 186 52 222 177 c7 25 1 35 -24 45 c-25 10 -49 24 -75 45 z",
  "M490 855 c-5 -21 -10 -43 -17 -64 c-17 -52 -38 -102 -61 -151 c-9 -19 -4 -28 15 -34 c33 -10 67 -17 101 -21 c88 -10 151 32 188 126 c12 30 7 42 -22 51 c-23 7 -46 22 -69 41 c-25 21 -48 37 -71 43 c-28 7 -43 -17 -64 9 z",
  "M680 830 c-12 -34 -24 -68 -38 -101 c-14 -33 -30 -65 -47 -96 c-11 -20 -6 -31 16 -37 c35 -10 71 -16 108 -18 c95 -6 163 38 203 135 c10 24 5 36 -20 44 c-23 7 -47 21 -70 41 c-29 25 -55 35 -84 21 c-24 -11 -42 -12 -68 11 z",
  "M180 620 l664 0 c15 0 25 8 25 22 c0 14 -10 22 -25 22 l-664 0 c-15 0 -25 -8 -25 -22 c0 -14 10 -22 25 -22 z",
  "M260 520 c150 -15 320 -25 504 -25 c18 0 28 8 28 22 c0 14 -10 22 -28 22 c-180 0 -346 10 -494 25 c-18 2 -28 -6 -30 -20 c-2 -14 6 -22 20 -24 z",
  "M512 480 l0 -180 c0 -15 8 -25 22 -25 c14 0 22 10 22 25 l0 180 c0 15 -8 25 -22 25 c-14 0 -22 -10 -22 -25 z",
  "M320 270 c90 -12 210 -20 384 -20 c18 0 28 8 28 22 c0 14 -10 22 -28 22 c-170 0 -286 8 -374 20 c-18 2 -28 -6 -30 -20 c-2 -14 6 -22 20 -24 z",
  "M460 250 c0 -60 2 -120 4 -180 c1 -16 11 -24 25 -24 c14 0 23 8 24 24 c-2 60 -4 120 -4 180 c0 15 -9 24 -24 24 c-15 0 -25 -9 -25 -24 z"
];

function getDeviceSvg(imgB64, w, h) {
  const radius = w * 0.14;
  return `
    <div style="width: ${w}px; height: ${h}px; border-radius: ${radius}px; background: linear-gradient(145deg, #2c2d32, #141518); padding: 12px; box-shadow: 0 40px 100px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.25); position: relative; display: flex; flex-direction: column; align-items: center; box-sizing: border-box;">
      <div style="position: absolute; top: 22px; width: ${w * 0.28}px; height: 26px; background: #000; border-radius: 20px; z-index: 10;"></div>
      <div style="width: 100%; height: 100%; border-radius: ${w * 0.12}px; overflow: hidden; background: #090a0f;">
        <img src="${imgB64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
    </div>
  `;
}

async function renderStaticHeader(browser) {
  console.log("Rendering Store Header (3840 x 1646)...");
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
          background: radial-gradient(circle at 75% 45%, #221522 0%, #0c0d14 55%, #06070a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
          position: relative;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <!-- Ambient red glow -->
      <div style="position: absolute; top: -200px; right: 400px; width: 1400px; height: 1400px; border-radius: 50%; background: radial-gradient(circle, rgba(235, 45, 36, 0.22) 0%, rgba(255, 106, 0, 0.06) 45%, transparent 70%); filter: blur(100px);"></div>

      <!-- Watermark Seal -->
      <div style="position: absolute; top: 120px; left: 180px; opacity: 0.07; font-size: 280px; font-weight: 900; font-family: 'PingFang SC', serif; letter-spacing: 24px; pointer-events: none;">学中文</div>

      <!-- Left Column Content -->
      <div style="position: absolute; left: 200px; top: 50%; transform: translateY(-50%); max-width: 1550px; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 36px; margin-bottom: 40px;">
          <img src="${appIconB64}" style="width: 130px; height: 130px; border-radius: 30px; box-shadow: 0 16px 45px rgba(255, 59, 48, 0.4), 0 0 0 2px rgba(255,255,255,0.2);" />
          <div>
            <div style="display: inline-flex; align-items: center; gap: 12px; padding: 10px 24px; border-radius: 40px; background: rgba(255, 59, 48, 0.16); border: 1px solid rgba(255, 59, 48, 0.4); color: #ff5247; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #ff3b30;"></span>
              HSK 1-3 • Interactive Calligraphy • Widgets
            </div>
            <div style="font-size: 28px; color: rgba(255,255,255,0.65); margin-top: 8px; font-weight: 500;">
              today.learnchinese.app
            </div>
          </div>
        </div>

        <h1 style="font-size: 112px; line-height: 1.05; font-weight: 800; letter-spacing: -2px; margin-bottom: 36px;">
          Master Mandarin,<br />
          <span style="background: linear-gradient(135deg, #ff453a 0%, #ff9f0a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">One Hanzi at a Time.</span>
        </h1>

        <p style="font-size: 36px; line-height: 1.45; color: rgba(255, 255, 255, 0.72); margin-bottom: 56px; max-width: 1320px;">
          Stroke-by-stroke vector calligraphy, interactive phrase puzzles, and spaced repetition directly on your iPhone Home & Lock Screen.
        </p>

        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 14px; padding: 18px 30px; border-radius: 20px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 24px; font-weight: 600;">
            <span>✍️</span><span>Interactive Stroke Order</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; padding: 18px 30px; border-radius: 20px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 24px; font-weight: 600;">
            <span>🧩</span><span>Phrase Game Puzzles</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; padding: 18px 30px; border-radius: 20px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 24px; font-weight: 600;">
            <span>📱</span><span>iOS Desktop Widgets</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; padding: 18px 30px; border-radius: 20px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 24px; font-weight: 600;">
            <span>🔊</span><span>Pinyin with Audio</span>
          </div>
        </div>
      </div>

      <!-- Right Column: 3-Device Carousel -->
      <div style="position: absolute; right: 160px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 30px; z-index: 8;">
        <div style="transform: translateY(60px) rotate(-8deg) scale(0.88); transform-origin: bottom center;">
          ${getDeviceSvg(phrasesScreenB64, 500, 1080)}
        </div>
        <div style="transform: scale(1.05); z-index: 12; position: relative;">
          ${getDeviceSvg(homeScreenB64, 540, 1160)}
          
          <!-- Floating Badge -->
          <div style="position: absolute; bottom: 120px; right: -120px; width: 300px; height: 300px; border-radius: 36px; background: rgba(20, 21, 28, 0.95); border: 1px solid rgba(255, 59, 48, 0.45); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(255, 59, 48, 0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
            <div style="font-size: 13px; font-weight: 800; color: #ff453a; letter-spacing: 1.5px; text-transform: uppercase;">
              Active Calligraphy
            </div>
            <svg viewBox="0 0 1024 1024" style="width: 170px; height: 170px; transform: scaleY(-1); margin: 6px 0;">
              <g stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="8 8">
                <line x1="0" y1="512" x2="1024" y2="512" />
                <line x1="512" y1="0" x2="512" y2="1024" />
                <rect x="10" y="10" width="1004" height="1004" fill="none" stroke-width="4" stroke-dasharray="none" />
              </g>
              ${xueStrokes.map(d => `<path d="${d}" fill="#ff3b30" />`).join("")}
            </svg>
            <div style="font-size: 17px; font-weight: 700; color: #ffffff;">学 • xué (study)</div>
          </div>
        </div>
        <div style="transform: translateY(60px) rotate(8deg) scale(0.88); transform-origin: bottom center;">
          ${getDeviceSvg(studyScreenB64, 500, 1080)}
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500);
  const outPath = join(outDir, "header-3840x1646.png");
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`Saved Header PNG: ${outPath}`);
}

async function renderStaticSearch(browser) {
  console.log("Rendering Store Search Result (3840 x 2560)...");
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
          background: radial-gradient(ellipse at 50% 30%, #1e141f 0%, #0c0d12 60%, #06070a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: space-between;
          padding: 160px 180px;
        }
      </style>
    </head>
    <body>
      <div style="position: absolute; top: 15%; left: 50%; transform: translateX(-50%); width: 2200px; height: 1600px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 59, 48, 0.18) 0%, rgba(255, 159, 10, 0.06) 50%, transparent 75%); filter: blur(120px);"></div>

      <!-- Top Section -->
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 2400px; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 36px; margin-bottom: 36px;">
          <img src="${appIconB64}" style="width: 140px; height: 140px; border-radius: 32px; box-shadow: 0 20px 50px rgba(255, 59, 48, 0.4), 0 0 0 2px rgba(255,255,255,0.2);" />
          <div style="text-align: left;">
            <div style="display: inline-flex; align-items: center; gap: 12px; padding: 8px 24px; border-radius: 40px; background: rgba(255, 59, 48, 0.16); border: 1px solid rgba(255, 59, 48, 0.4); color: #ff5247; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
              Learn Chinese Today • 学中文
            </div>
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-top: 8px;">
              HSK 1-3 Everyday Mastery
            </div>
          </div>
        </div>

        <h1 style="font-size: 136px; line-height: 1.05; font-weight: 800; letter-spacing: -3px; margin: 0;">
          Read, Write & Speak<br />
          <span style="background: linear-gradient(135deg, #ff453a 0%, #ff9f0a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Real Mandarin Naturally.</span>
        </h1>

        <p style="font-size: 40px; line-height: 1.4; color: rgba(255, 255, 255, 0.7); margin-top: 32px; max-width: 1900px;">
          Dynamic character stroke writing, full phrase games, and instant widgets for lock & home screen.
        </p>
      </div>

      <!-- Center Showcase with Floating Cards -->
      <div style="position: relative; width: 100%; display: flex; justify-content: center; align-items: center; z-index: 8; margin: 40px 0;">
        <!-- Left Widget -->
        <div style="position: absolute; left: 240px; top: 50%; transform: translateY(-50%) scale(1.4); z-index: 14; width: 320px; height: 320px; border-radius: 48px; background: linear-gradient(145deg, rgba(32, 34, 42, 0.95), rgba(18, 19, 24, 0.95)); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7); padding: 26px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff3b30; box-shadow: 0 0 8px #ff3b30;"></div>
              <span style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 0.5px;">DAILY HANZI</span>
            </div>
            <span style="font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 8px; background: rgba(255, 59, 48, 0.2); color: #ff453a;">HSK 1</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <span style="font-size: 88px; font-weight: 800; line-height: 1; font-family: 'PingFang SC', sans-serif;">学</span>
            <span style="font-size: 22px; font-weight: 600; color: #ff9f0a; margin-top: 6px;">xué</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Meaning</div>
              <div style="font-size: 15px; font-weight: 600; color: #ffffff;">To study, learn</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Radical</div>
              <div style="font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.8);">子 (child)</div>
            </div>
          </div>
        </div>

        <!-- Center Phone Frame -->
        <div style="transform: scale(1.06); z-index: 12;">
          ${getDeviceSvg(homeScreenB64, 660, 1420)}
        </div>

        <!-- Right Calligraphy Card -->
        <div style="position: absolute; right: 240px; top: 50%; transform: translateY(-50%); z-index: 14; width: 440px; border-radius: 48px; background: linear-gradient(145deg, rgba(32, 34, 42, 0.96), rgba(18, 19, 24, 0.96)); border: 1px solid rgba(255, 59, 48, 0.45); box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 59, 48, 0.25); padding: 36px; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 15px; font-weight: 800; letter-spacing: 2px; color: #ff453a; text-transform: uppercase; margin-bottom: 12px;">
            Live Stroke Order
          </div>
          <svg viewBox="0 0 1024 1024" style="width: 250px; height: 250px; transform: scaleY(-1);">
            <g stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="8 8">
              <line x1="0" y1="512" x2="1024" y2="512" />
              <line x1="512" y1="0" x2="512" y2="1024" />
              <rect x="10" y="10" width="1004" height="1004" fill="none" stroke-width="4" stroke-dasharray="none" />
            </g>
            <path d="M250 720 l0 -420 c0 -20 15 -35 35 -35 l460 0 c20 0 35 15 35 35 l0 420 c0 20 -15 35 -35 35 l-460 0 c-20 0 -35 -15 -35 -35 z M310 325 l400 0 l0 340 l-400 0 z" fill="#ff3b30" />
            <path d="M485 920 l0 -820 c0 -20 15 -35 35 -35 c20 0 35 15 35 35 l0 820 c0 20 -15 35 -35 35 c-20 0 -35 -15 -35 -35 z" fill="#ff3b30" />
          </svg>
          <div style="text-align: center; margin-top: 14px;">
            <div style="font-size: 34px; font-weight: 700;">中 • zhōng</div>
            <div style="font-size: 18px; color: rgba(255,255,255,0.65); margin-top: 4px;">Middle, Center, China</div>
          </div>
        </div>
      </div>

      <!-- Bottom Feature Pillars -->
      <div style="display: flex; justify-content: center; gap: 60px; width: 100%; z-index: 10;">
        <div style="flex: 1; max-width: 820px; padding: 36px 44px; border-radius: 32px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: flex-start; gap: 24px;">
          <div style="font-size: 48px; padding: 16px 20px; border-radius: 20px; background: rgba(255, 59, 48, 0.15);">🧩</div>
          <div>
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Sentence Puzzle Game</div>
            <div style="font-size: 22px; color: rgba(255,255,255,0.65); line-height: 1.4;">Drag and drop real sentences with immediate grammar feedback</div>
          </div>
        </div>

        <div style="flex: 1; max-width: 820px; padding: 36px 44px; border-radius: 32px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: flex-start; gap: 24px;">
          <div style="font-size: 48px; padding: 16px 20px; border-radius: 20px; background: rgba(255, 59, 48, 0.15);">✍️</div>
          <div>
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">600+ Stroke Characters</div>
            <div style="font-size: 22px; color: rgba(255,255,255,0.65); line-height: 1.4;">Native vector calligraphy with strict stroke order guidance</div>
          </div>
        </div>

        <div style="flex: 1; max-width: 820px; padding: 36px 44px; border-radius: 32px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: flex-start; gap: 24px;">
          <div style="font-size: 48px; padding: 16px 20px; border-radius: 20px; background: rgba(255, 59, 48, 0.15);">📲</div>
          <div>
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Home Screen Memorize</div>
            <div style="font-size: 22px; color: rgba(255,255,255,0.65); line-height: 1.4;">Spaced repetition widgets cycling characters throughout your day</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500);
  const outPath = join(outDir, "search-3840x2560.png");
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`Saved Search PNG: ${outPath}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  await renderStaticHeader(browser);
  await renderStaticSearch(browser);
  await browser.close();
  console.log("Static assets rendering completed successfully!");
})().catch(e => {
  console.error("Static render error:", e);
  process.exit(1);
});
