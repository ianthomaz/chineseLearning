import playwright from "../QA/node_modules/@playwright/test/index.js";
import { readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const { chromium } = playwright;
const root = process.cwd();
const elementsDir = join(root, "appMobile/store/asc-creative/elements");
const ascDir = join(root, "appMobile/store/asc-creative");
const reelsDir = join(root, "appMobile/store/reels");
const audioDir = join(root, "appMobile/store/audio");
const tmpDir = join(root, "appMobile/store/.tmp_watercolor");

mkdirSync(ascDir, { recursive: true });
mkdirSync(reelsDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

// Load Master Assets as Base64
const bgWatercolorB64 = `data:image/png;base64,${readFileSync(join(elementsDir, "bg_watercolor_5244x1590.png")).toString("base64")}`;
const bambooB64 = `data:image/png;base64,${readFileSync(join(elementsDir, "bamboo_branch.png")).toString("base64")}`;
const sealB64 = `data:image/png;base64,${readFileSync(join(elementsDir, "chinese_seal_stamp.png")).toString("base64")}`;
const mountainsB64 = `data:image/png;base64,${readFileSync(join(elementsDir, "ink_mountain_splatter.png")).toString("base64")}`;
const homeScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/02-home.png")).toString("base64")}`;
const phrasesScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/03-phrases.png")).toString("base64")}`;
const studyScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/05-study.png")).toString("base64")}`;
const appIconB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png")).toString("base64")}`;

// Helper: Elegant iPhone frame matching the warm aesthetic
function getPhoneFrame(imgB64, w = 430, h = 910) {
  const radius = w * 0.135;
  return `
    <div style="width: ${w}px; height: ${h}px; border-radius: ${radius}px; background: #1C1B18; padding: 10px; box-shadow: 0 35px 80px rgba(70, 50, 30, 0.28), 0 10px 25px rgba(0,0,0,0.18); position: relative; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; flex-shrink: 0;">
      <div style="position: absolute; top: 18px; width: ${w * 0.28}px; height: 22px; background: #000000; border-radius: 20px; z-index: 10;"></div>
      <div style="width: 100%; height: 100%; border-radius: ${w * 0.115}px; overflow: hidden; background: #ffffff;">
        <img src="${imgB64}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
    </div>
  `;
}

// Helper: Clean Ivory Hanzi Card with modern, crystal-clear PingFang SC font (e404 standard)
function getHanziCard(hanzi, pinyin, meaning, radical, hsk = "HSK 1", w = 520, h = 640) {
  return `
    <div style="width: ${w}px; height: ${h}px; border-radius: 40px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); padding: 36px 40px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; box-sizing: border-box; flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #B8332A;"></div>
          <span style="font-family: -apple-system, sans-serif; font-size: 16px; font-weight: 700; color: #8A7E6C; letter-spacing: 2px;">DAILY HANZI</span>
        </div>
        <span style="font-family: -apple-system, sans-serif; font-size: 15px; font-weight: 700; padding: 6px 14px; border-radius: 12px; background: rgba(184, 51, 42, 0.1); color: #B8332A;">${hsk}</span>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; margin: 10px 0;">
        <span style="font-family: 'PingFang SC', -apple-system, 'Noto Sans SC', sans-serif; font-size: 180px; font-weight: 600; line-height: 1; color: #1C1B18;">
          ${hanzi}
        </span>
        <span style="font-family: -apple-system, sans-serif; font-size: 38px; font-weight: 600; color: #B8332A; margin-top: 12px; letter-spacing: 1px;">
          ${pinyin}
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; width: 100%; border-top: 1.5px solid rgba(190, 165, 130, 0.25); padding-top: 20px;">
        <div style="text-align: left;">
          <div style="font-family: -apple-system, sans-serif; font-size: 14px; color: #8A7E6C; text-transform: uppercase; letter-spacing: 1px;">Meaning</div>
          <div style="font-family: -apple-system, sans-serif; font-size: 24px; font-weight: 600; color: #1C1B18; margin-top: 2px;">${meaning}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: -apple-system, sans-serif; font-size: 14px; color: #8A7E6C; text-transform: uppercase; letter-spacing: 1px;">Radical</div>
          <div style="font-family: 'PingFang SC', -apple-system, sans-serif; font-size: 22px; font-weight: 500; color: #4A443B; margin-top: 2px;">${radical}</div>
        </div>
      </div>
    </div>
  `;
}

// Master HTML Wrapper for 1080x1920 Reels with Watercolor aesthetic
function getReelHtml({ tag, title, bodyContent, ctaText = "Download on App Store", footerNote = "Immediate audio & grammar validation" }) {
  return `
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
          color: #1C1B18;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: space-between;
          padding: 80px 60px 80px 60px;
        }
      </style>
    </head>
    <body>
      <!-- Background Rice Paper & Ink Wash Landscape -->
      <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1;">
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 60% 25%, #FBF7EE 0%, #F3ECE0 60%, #E9DFC9 100%);"></div>
        <img src="${mountainsB64}" style="position: absolute; bottom: 0; right: 0; width: 750px; height: auto; opacity: 0.75; mix-blend-mode: multiply;" />
        <img src="${bambooB64}" style="position: absolute; top: -30px; right: -40px; width: 520px; height: auto; mix-blend-mode: multiply; opacity: 0.85;" />
      </div>

      <!-- TOP BRAND HEADER (Zero overlap guaranteed) -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;">
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 10px;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-family: 'Songti SC', 'Playfair Display', serif; font-size: 40px; font-weight: 600; color: #1C1B18; letter-spacing: -0.5px;">
              LearnChinese Today
            </span>
            <span style="font-family: -apple-system, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 3px; color: #8A7E6C; text-transform: uppercase; margin-top: 4px;">
              Mandarin Learning App
            </span>
          </div>
          <img src="${sealB64}" style="width: 60px; height: 60px; border-radius: 6px; box-shadow: 0 4px 12px rgba(184, 51, 42, 0.25);" />
        </div>

        <div style="display: flex; align-items: center; gap: 14px; width: 100%; margin: 20px 0 0 0;">
          <div style="flex: 1; height: 1.5px; background: #B8332A; opacity: 0.6;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #B8332A;"></div>
          <div style="flex: 1; height: 1.5px; background: #B8332A; opacity: 0.6;"></div>
        </div>
      </div>

      <!-- MIDDLE STAGE (Dedicated vertical slot) -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; z-index: 10; margin: 10px 0;">
        ${tag ? `
          <div style="font-family: -apple-system, sans-serif; font-size: 17px; font-weight: 800; color: #B8332A; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">
            ${tag}
          </div>
        ` : ""}
        
        <h1 style="font-family: 'Songti SC', 'Playfair Display', serif; font-size: 54px; font-weight: 600; color: #1C1B18; line-height: 1.15; letter-spacing: -1px; margin-bottom: 28px; max-width: 880px;">
          ${title}
        </h1>

        ${bodyContent}
      </div>

      <!-- BOTTOM CTA BAR -->
      <div style="width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 10;">
        ${footerNote ? `
          <div style="display: flex; align-items: center; gap: 10px; background: rgba(184, 51, 42, 0.08); border: 1px solid rgba(184, 51, 42, 0.22); padding: 12px 24px; border-radius: 30px; margin-bottom: 20px;">
            <span style="font-size: 18px;">✨</span>
            <span style="font-family: -apple-system, sans-serif; font-size: 17px; font-weight: 700; color: #8A251E;">
              ${footerNote}
            </span>
          </div>
        ` : ""}

        <div style="width: 100%; max-width: 640px; padding: 22px 0; border-radius: 36px; background: #B8332A; color: #FFFFFF; font-family: -apple-system, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-align: center; box-shadow: 0 15px 35px rgba(184, 51, 42, 0.35);">
          ${ctaText}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Master CTA Final Screen for Reels
function getReelCtaScreen(headline, subheadline) {
  return `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin: 40px 0;">
      <img src="${appIconB64}" style="width: 180px; height: 180px; border-radius: 40px; box-shadow: 0 25px 60px rgba(70, 50, 30, 0.22), 0 0 0 2px rgba(184, 51, 42, 0.2); margin-bottom: 40px;" />
      
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
        <img src="${sealB64}" style="width: 64px; height: 64px; border-radius: 6px;" />
        <span style="font-family: 'Songti SC', 'Playfair Display', serif; font-size: 44px; font-weight: 600; color: #1C1B18;">
          LearnChinese Today
        </span>
      </div>

      <p style="font-family: -apple-system, sans-serif; font-size: 28px; color: #6E6556; max-width: 680px; line-height: 1.45; margin-bottom: 20px;">
        ${subheadline}
      </p>
    </div>
  `;
}

// Render Video with Crossfade and Audio
async function renderReel(browser, name, scenesHtml, audioFile, durationSeconds) {
  console.log(`Rendering Reel: ${name} (${durationSeconds}s)...`);
  const framePaths = [];

  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 0; i < scenesHtml.length; i++) {
    const fPath = join(tmpDir, `${name}_s${i}.png`);
    await page.setContent(scenesHtml[i]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: fPath, type: "png" });
    framePaths.push(fPath);
  }
  await page.close();

  const clipDuration = (durationSeconds + 1.2) / 3;
  const clipPaths = [];

  for (let i = 0; i < framePaths.length; i++) {
    const cPath = join(tmpDir, `${name}_c${i}.mp4`);
    execFileSync("/opt/homebrew/bin/ffmpeg", [
      "-y",
      "-loop", "1",
      "-i", framePaths[i],
      "-t", clipDuration.toFixed(2),
      "-vf", "scale=1080:1920,format=yuv420p",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-r", "30",
      cPath
    ]);
    clipPaths.push(cPath);
  }

  const outMp4 = join(reelsDir, `${name}.mp4`);
  const off1 = (durationSeconds * 0.33).toFixed(2);
  const off2 = (durationSeconds * 0.66).toFixed(2);

  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-i", clipPaths[0],
    "-i", clipPaths[1],
    "-i", clipPaths[2],
    "-i", join(audioDir, audioFile),
    "-filter_complex",
    `[0:v][1:v]xfade=transition=fade:duration=0.5:offset=${off1}[v01];[v01][2:v]xfade=transition=fade:duration=0.5:offset=${off2}[v]`,
    "-map", "[v]",
    "-map", "3:a",
    "-t", durationSeconds.toString(),
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    outMp4
  ]);
  console.log(`Successfully generated Reel: ${outMp4}`);
}

async function renderStoreVideo(inputPng, audioFile, durationSeconds, outMp4) {
  console.log(`Generating Store Video: ${outMp4}...`);
  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", inputPng,
    "-i", join(audioDir, audioFile),
    "-t", durationSeconds.toString(),
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    outMp4
  ]);
  console.log(`Successfully saved Store Video: ${outMp4}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // --- REEL 1: Microlearning Habit & Daily Routine (10s) ---
  await renderReel(
    browser,
    "reel1-daily-routine-10s",
    [
      getReelHtml({
        tag: "Microlearning Routine • 每日微习惯",
        title: "Learn Mandarin in<br />5 Minutes a Day",
        bodyContent: getHanziCard("好", "hǎo", "Good, fine, well", "女 (female)", "HSK 1", 520, 680),
        footerNote: "Spaced repetition on your iPhone Screen"
      }),
      getReelHtml({
        tag: "Interactive Practice • 真实语境",
        title: "Practice Real Sentences",
        bodyContent: getPhoneFrame(phrasesScreenB64, 430, 900),
        footerNote: "Immediate audio & grammar validation"
      }),
      getReelHtml({
        tag: "LearnChinese Today • 学中文",
        title: "Start Your Journey Today",
        bodyContent: getReelCtaScreen("LearnChinese Today", "Available now on iPhone, iPad & Web.<br />No subscription required to start."),
        ctaText: "Download on App Store",
        footerNote: ""
      })
    ],
    "reel1_daily_routine.mp3",
    10
  );

  // --- REEL 2: Visual Hanzi Anatomy & Radicals (10s) ---
  await renderReel(
    browser,
    "reel2-visual-hanzi-10s",
    [
      getReelHtml({
        tag: "Visual Anatomy • 汉字解构",
        title: "Characters Aren't Random.<br />Understand the Anatomy.",
        bodyContent: `
          <div style="width: 580px; padding: 48px 36px; border-radius: 36px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); margin: 30px 0;">
            <div style="font-family: 'PingFang SC', sans-serif; font-size: 140px; font-weight: 600; color: #1C1B18; line-height: 1;">爱</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 36px; font-weight: 600; color: #B8332A; margin: 12px 0 24px 0;">ài • love</div>
            <div style="display: flex; justify-content: center; gap: 16px;">
              <span style="font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 600; padding: 8px 16px; border-radius: 12px; background: rgba(184, 51, 42, 0.1); color: #B8332A;">Radical: 爫 (claw)</span>
              <span style="font-family: -apple-system, sans-serif; font-size: 18px; font-weight: 600; padding: 8px 16px; border-radius: 12px; background: rgba(70, 60, 50, 0.08); color: #4A443B;">10 Strokes</span>
            </div>
          </div>
        `,
        footerNote: "Every character has an origin and rhythm"
      }),
      getReelHtml({
        tag: "Guided Calligraphy • 笔顺动态",
        title: "Stroke-by-Stroke Engine",
        bodyContent: getPhoneFrame(studyScreenB64, 430, 900),
        footerNote: "Tian Zi Ge Guide Grid & Strict Validation"
      }),
      getReelHtml({
        tag: "LearnChinese Today • 学中文",
        title: "Master 600+ Essential Hanzi",
        bodyContent: getReelCtaScreen("LearnChinese Today", "Trace, memorize, and recall effortlessly.<br />Designed for native clarity."),
        ctaText: "Get Learn Chinese Today",
        footerNote: ""
      })
    ],
    "reel2_visual_hanzi.mp3",
    10
  );

  // --- REEL 3: Contextual Phrases in Action (10s) ---
  await renderReel(
    browser,
    "reel3-phrases-action-10s",
    [
      getReelHtml({
        tag: "Contextual Grammar • 完整句子",
        title: "Stop Memorizing Words.<br />Learn Complete Sentences.",
        bodyContent: `
          <div style="width: 600px; padding: 40px; border-radius: 36px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); margin: 30px 0;">
            <div style="font-family: 'PingFang SC', sans-serif; font-size: 48px; font-weight: 600; color: #1C1B18; margin-bottom: 12px;">我喜欢学中文</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 26px; color: #B8332A; font-weight: 600;">Wǒ xǐhuan xué zhōngwén</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 22px; color: #6E6556; margin-top: 8px;">"I like learning Chinese."</div>
          </div>
        `,
        footerNote: "Natural syntax & spoken cadence"
      }),
      getReelHtml({
        tag: "Interactive Puzzle • 实时拼图",
        title: "Assemble Like a Puzzle",
        bodyContent: getPhoneFrame(phrasesScreenB64, 430, 900),
        footerNote: "Immediate grammar syntax validation"
      }),
      getReelHtml({
        tag: "LearnChinese Today • 学中文",
        title: "Speak Natural Mandarin",
        bodyContent: getReelCtaScreen("LearnChinese Today", "Hundreds of curated sentences by difficulty.<br />Built for lasting retention."),
        ctaText: "Start Playing Today",
        footerNote: ""
      })
    ],
    "reel3_phrases_action.mp3",
    10
  );

  // --- REEL 4: The Phrase Game (12s) ---
  await renderReel(
    browser,
    "reel4-phrase-game-12s",
    [
      getReelHtml({
        tag: "Featured Mode • 句型拼图",
        title: "The Phrase Game",
        bodyContent: `
          <div style="width: 600px; padding: 44px 36px; border-radius: 36px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); margin: 30px 0;">
            <div style="font-size: 64px; margin-bottom: 16px;">🧩</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 28px; font-weight: 700; color: #1C1B18; line-height: 1.4;">
              Turn sentence building into an addictive tactile puzzle.
            </div>
          </div>
        `,
        footerNote: "Tactile drag-and-drop gameplay"
      }),
      getReelHtml({
        tag: "Sentence Building • 语序重组",
        title: "Assemble the Sentence",
        bodyContent: `
          <div style="display: flex; gap: 14px; justify-content: center; margin-bottom: 24px;">
            <div style="width: 120px; height: 130px; border-radius: 20px; background: #FFFFFF; border: 2px solid #B8332A; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(184, 51, 42, 0.15);">
              <span style="font-family: 'PingFang SC', sans-serif; font-size: 44px; font-weight: 600;">我</span>
              <span style="font-size: 16px; color: #B8332A; font-weight: 600;">wǒ</span>
            </div>
            <div style="width: 120px; height: 130px; border-radius: 20px; background: #FFFFFF; border: 2px solid #B8332A; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(184, 51, 42, 0.15);">
              <span style="font-family: 'PingFang SC', sans-serif; font-size: 44px; font-weight: 600;">在</span>
              <span style="font-size: 16px; color: #B8332A; font-weight: 600;">zài</span>
            </div>
            <div style="width: 120px; height: 130px; border-radius: 20px; background: #FFFFFF; border: 2px solid #B8332A; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(184, 51, 42, 0.15);">
              <span style="font-family: 'PingFang SC', sans-serif; font-size: 44px; font-weight: 600;">学</span>
              <span style="font-size: 16px; color: #B8332A; font-weight: 600;">xué</span>
            </div>
            <div style="width: 130px; height: 130px; border-radius: 20px; background: #FFFFFF; border: 2px solid #B8332A; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(184, 51, 42, 0.15);">
              <span style="font-family: 'PingFang SC', sans-serif; font-size: 40px; font-weight: 600;">中文</span>
              <span style="font-size: 15px; color: #B8332A; font-weight: 600;">zhōngwén</span>
            </div>
          </div>
          ${getPhoneFrame(phrasesScreenB64, 380, 780)}
        `,
        footerNote: "Active recall with audio pronunciation"
      }),
      getReelHtml({
        tag: "The Phrase Game • 句型拼图",
        title: "Master Grammar Through Play",
        bodyContent: getReelCtaScreen("The Phrase Game", "Hundreds of authentic sentences across HSK levels.<br />Play anytime on iOS & Web."),
        ctaText: "Play Phrase Game Now",
        footerNote: ""
      })
    ],
    "reel4_phrase_game.mp3",
    12
  );

  // --- REEL 5: Hanzi Widgets on iPhone (12s) ---
  await renderReel(
    browser,
    "reel5-widget-home-12s",
    [
      getReelHtml({
        tag: "iOS Widgets • 桌面小组件",
        title: "Hanzi on Your<br />iPhone Home Screen",
        bodyContent: `
          <div style="width: 600px; padding: 44px 36px; border-radius: 36px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); margin: 30px 0;">
            <div style="font-size: 64px; margin-bottom: 16px;">📲</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 26px; font-weight: 600; color: #1C1B18; line-height: 1.45;">
              Passive spaced repetition. Every unlock reinforces a new Hanzi automatically.
            </div>
          </div>
        `,
        footerNote: "Home Screen & Lock Screen Support"
      }),
      getReelHtml({
        tag: "Spaced Repetition • 自动轮播",
        title: "Native WidgetKit",
        bodyContent: `
          <div style="display: flex; flex-direction: column; gap: 24px; align-items: center; margin: 10px 0;">
            ${getHanziCard("水", "shuǐ", "Water, liquid", "水 (water)", "HSK 1", 500, 420)}
            ${getHanziCard("山", "shān", "Mountain, hill", "山 (mountain)", "HSK 1", 500, 420)}
          </div>
        `,
        footerNote: "Tap widget to jump straight into study"
      }),
      getReelHtml({
        tag: "iOS Widgets • 桌面小组件",
        title: "Learn Passively Today",
        bodyContent: getReelCtaScreen("iOS Widgets", "Add Learn Chinese Today widgets to your iPhone.<br />Daily micro-learning without friction."),
        ctaText: "Add Widgets to iPhone",
        footerNote: ""
      })
    ],
    "reel5_widget_home.mp3",
    12
  );

  // --- REEL 6: Character Stroke Order & Calligraphy (12s) ---
  await renderReel(
    browser,
    "reel6-stroke-calligraphy-12s",
    [
      getReelHtml({
        tag: "Stroke Order Engine • 笔顺动画",
        title: "Calligraphy Is<br />Choreography",
        bodyContent: `
          <div style="width: 600px; padding: 44px 36px; border-radius: 36px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); margin: 30px 0;">
            <div style="font-size: 64px; margin-bottom: 16px;">✍️</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 26px; font-weight: 600; color: #1C1B18; line-height: 1.45;">
              Learn the exact stroke rhythm of Chinese writing with real-time vector guidance.
            </div>
          </div>
        `,
        footerNote: "Official Hanzi Writer Stroke Vector Database"
      }),
      getReelHtml({
        tag: "Vector Calligraphy • 笔画引擎",
        title: "Precision Stroke by Stroke",
        bodyContent: `
          <div style="width: 540px; border-radius: 36px; background: #FFFFFF; border: 1.5px solid rgba(190, 165, 130, 0.35); box-shadow: 0 30px 70px rgba(80, 55, 30, 0.16); padding: 36px; display: flex; flex-direction: column; align-items: center; margin-bottom: 24px;">
            <div style="width: 260px; height: 260px; border: 2px dashed rgba(184, 51, 42, 0.3); display: flex; align-items: center; justify-content: center; position: relative;">
              <span style="font-family: 'PingFang SC', sans-serif; font-size: 190px; font-weight: 600; color: #B8332A; line-height: 1;">文</span>
            </div>
            <div style="font-family: -apple-system, sans-serif; font-size: 34px; font-weight: 700; color: #1C1B18; margin-top: 14px;">文 • wén</div>
            <div style="font-family: -apple-system, sans-serif; font-size: 20px; color: #6E6556; margin-top: 4px;">Language, Writing, Culture</div>
          </div>
        `,
        footerNote: "Tian Zi Ge Guide Grid & Stroke Count"
      }),
      getReelHtml({
        tag: "LearnChinese Today • 学中文",
        title: "Learn to Write Real Chinese",
        bodyContent: getReelCtaScreen("LearnChinese Today", "Trace 600+ characters with accurate stroke orders.<br />Available offline on iOS & Web."),
        ctaText: "Download Free on App Store",
        footerNote: ""
      })
    ],
    "reel6_stroke_calligraphy.mp3",
    12
  );

  await browser.close();

  // Render animated store videos
  await renderStoreVideo(
    join(ascDir, "header-3840x1646.png"),
    "store_ambient_header.mp3",
    10,
    join(ascDir, "header-3840x1646.mp4")
  );

  await renderStoreVideo(
    join(ascDir, "search-3840x2560.png"),
    "store_ambient_header.mp3",
    10,
    join(ascDir, "search-3840x2560.mp4")
  );

  console.log("ALL CREATIVES SUCCESSFULLY BUILT WITH WATERCOLOR IDENTITY!");
}

run().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
