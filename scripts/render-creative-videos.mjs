import playwright from "../QA/node_modules/@playwright/test/index.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const { chromium } = playwright;
const root = process.cwd();
const tmpDir = join(root, "appMobile/store/.tmp_frames");
mkdirSync(tmpDir, { recursive: true });

const ascDir = join(root, "appMobile/store/asc-creative");
const reelsDir = join(root, "appMobile/store/reels");
const audioDir = join(root, "appMobile/store/audio");
mkdirSync(ascDir, { recursive: true });
mkdirSync(reelsDir, { recursive: true });

// Assets base64
const appIconB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png")).toString("base64")}`;
const homeScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/02-home.png")).toString("base64")}`;
const phrasesScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/03-phrases.png")).toString("base64")}`;
const studyScreenB64 = `data:image/png;base64,${readFileSync(join(root, "appMobile/store/screenshots/iphone-67/05-study.png")).toString("base64")}`;

function getDeviceFrame(imgB64, w, h) {
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

function getWidgetHtml(hanzi, pinyin, meaning, radical, level, color = "#ff3b30") {
  return `
    <div style="width: 480px; height: 480px; border-radius: 64px; background: linear-gradient(145deg, rgba(32, 34, 42, 0.96), rgba(18, 19, 24, 0.96)); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7); padding: 40px; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; font-family: -apple-system, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; box-shadow: 0 0 10px ${color};"></div>
          <span style="font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 1px;">DAILY HANZI</span>
        </div>
        <span style="font-size: 16px; font-weight: 700; padding: 6px 14px; border-radius: 12px; background: rgba(255, 59, 48, 0.2); color: ${color};">${level}</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span style="font-size: 140px; font-weight: 800; line-height: 1; font-family: 'PingFang SC', sans-serif;">${hanzi}</span>
        <span style="font-size: 34px; font-weight: 600; color: #ff9f0a; margin-top: 10px;">${pinyin}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 18px;">
        <div>
          <div style="font-size: 16px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Meaning</div>
          <div style="font-size: 24px; font-weight: 600; color: #ffffff;">${meaning}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 16px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Radical</div>
          <div style="font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.8);">${radical}</div>
        </div>
      </div>
    </div>
  `;
}

function getReelBaseHtml(contentHtml, accentColor = "#ff3b30", badgeText = "Learn Chinese Today") {
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
          background: radial-gradient(circle at 50% 32%, #181924 0%, #0d0e14 60%, #06070a 100%);
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          padding: 80px 60px;
        }
      </style>
    </head>
    <body>
      <div style="position: absolute; top: 350px; left: 50%; transform: translateX(-50%); width: 850px; height: 850px; border-radius: 50%; background: radial-gradient(circle, ${accentColor}33 0%, rgba(255, 106, 0, 0.08) 50%, transparent 70%); filter: blur(100px);"></div>

      <!-- Top Badge -->
      <div style="position: absolute; top: 80px; left: 0; right: 0; display: flex; justify-content: center; z-index: 20;">
        <div style="padding: 10px 24px; border-radius: 30px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.9);">
          ${badgeText}
        </div>
      </div>

      ${contentHtml}
    </body>
    </html>
  `;
}

// CTA Screen HTML for Reels
function getCtaScreenHtml(title1, title2, subtitle, btnText, accentGradient = "linear-gradient(135deg, #ff453a, #ff9f0a)", shadowColor = "rgba(255, 59, 48, 0.45)") {
  return `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; z-index: 10;">
      <img src="${appIconB64}" style="width: 180px; height: 180px; border-radius: 42px; box-shadow: 0 30px 70px ${shadowColor}, 0 0 0 2px rgba(255,255,255,0.2); margin-bottom: 40px;" />
      
      <h2 style="font-size: 68px; line-height: 1.1; font-weight: 800; letter-spacing: -1.5px; margin: 0 0 20px 0;">
        ${title1}<br />
        <span style="background: ${accentGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${title2}</span>
      </h2>

      <p style="font-size: 26px; color: rgba(255,255,255,0.7); max-width: 620px; line-height: 1.4; margin-bottom: 60px;">
        ${subtitle}
      </p>

      <div style="padding: 24px 64px; border-radius: 40px; background: ${accentGradient}; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 1px; box-shadow: 0 20px 50px ${shadowColor};">
        ${btnText}
      </div>
    </div>
  `;
}

// Render 3 scene frames and combine into an MP4 with smooth transitions and audio
async function buildReelVideo(browser, name, scenesHtml, audioFile, durationSeconds, transitionType = "fade") {
  console.log(`Building Reel: ${name} (${durationSeconds}s)...`);
  const framePaths = [];

  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 0; i < scenesHtml.length; i++) {
    const fPath = join(tmpDir, `${name}_scene_${i}.png`);
    await page.setContent(scenesHtml[i]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: fPath, type: "png" });
    framePaths.push(fPath);
  }
  await page.close();

  // Create video clips with zoom/pan motion
  const clipDuration = (durationSeconds + 1.5) / 3; // overlap buffer for xfade
  const clipPaths = [];

  for (let i = 0; i < framePaths.length; i++) {
    const clipOut = join(tmpDir, `${name}_clip_${i}.mp4`);
    execFileSync("/opt/homebrew/bin/ffmpeg", [
      "-y",
      "-loop", "1",
      "-i", framePaths[i],
      "-t", clipDuration.toFixed(2),
      "-vf", `scale=1080:1920,format=yuv420p`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-r", "30",
      clipOut
    ]);
    clipPaths.push(clipOut);
  }

  // Crossfade concatenate clips using xfade filter + mux audio
  const outMp4 = join(reelsDir, `${name}.mp4`);
  const offset1 = (durationSeconds * 0.33).toFixed(2);
  const offset2 = (durationSeconds * 0.66).toFixed(2);

  execFileSync("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-i", clipPaths[0],
    "-i", clipPaths[1],
    "-i", clipPaths[2],
    "-i", join(audioDir, audioFile),
    "-filter_complex",
    `[0:v][1:v]xfade=transition=${transitionType}:duration=0.6:offset=${offset1}[v01];[v01][2:v]xfade=transition=${transitionType}:duration=0.6:offset=${offset2}[v]`,
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

  console.log(`Generated Reel Video: ${outMp4}`);
}

// Build animated header & search MP4s
async function buildStoreVideo(inputPng, audioFile, durationSeconds, outMp4) {
  console.log(`Building Store Video: ${outMp4}...`);
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
  console.log(`Saved Store Video: ${outMp4}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. REEL 1: Daily Routine (10s)
  await buildReelVideo(
    browser,
    "reel1-daily-routine-10s",
    [
      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 22px; font-weight: 800; color: #ff453a; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px;">Microlearning Habit</div>
          <h1 style="font-size: 64px; line-height: 1.15; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 50px;">
            Learn Mandarin in<br /><span style="background: linear-gradient(135deg, #ff453a, #ff9f0a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">5 Minutes a Day.</span>
          </h1>
          <div style="display: flex; justify-content: center; margin-bottom: 50px;">
            ${getWidgetHtml("好", "hǎo", "Good, fine, well", "女 (female)", "HSK 1", "#ff453a")}
          </div>
          <p style="font-size: 26px; color: rgba(255,255,255,0.75); max-width: 700px; line-height: 1.4;">
            Directly from your iPhone Lock & Home Screen. Effortless daily exposure.
          </p>
        </div>
      `, "#ff453a", "Microlearning Routine • 每日微习惯"),

      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 20px; font-weight: 800; color: #ff453a; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">Active Practice</div>
          <h2 style="font-size: 56px; font-weight: 800; letter-spacing: -1px; margin-bottom: 40px;">Practice Real Sentences</h2>
          <div style="display: flex; justify-content: center; transform: scale(1.02); margin-bottom: 30px;">
            ${getDeviceFrame(phrasesScreenB64, 460, 980)}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 14px; background: rgba(255, 59, 48, 0.15); border: 1px solid rgba(255, 59, 48, 0.3); padding: 12px 28px; border-radius: 30px;">
            <span style="font-size: 24px;">✨</span>
            <span style="font-size: 22px; font-weight: 700;">Immediate audio & grammar validation</span>
          </div>
        </div>
      `, "#ff453a", "Daily Practice • 每日练习"),

      getReelBaseHtml(
        getCtaScreenHtml(
          "Start Your",
          "Mandarin Journey",
          "Available now on iPhone, iPad & Web. No subscriptions required to start.",
          "Download on App Store"
        ),
        "#ff453a",
        "Learn Chinese Today • 学中文"
      )
    ],
    "reel1_daily_routine.mp3",
    10,
    "fade"
  );

  // 2. REEL 2: Visual Hanzi Mastery (10s)
  await buildReelVideo(
    browser,
    "reel2-visual-hanzi-10s",
    [
      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 22px; font-weight: 800; color: #ff2d55; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;">Smarter Learning</div>
          <h1 style="font-size: 66px; line-height: 1.15; font-weight: 800; margin-bottom: 40px; letter-spacing: -1.5px;">
            Chinese Characters<br />Aren't Random Lines.
          </h1>
          <div style="padding: 28px 40px; border-radius: 28px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 32px; color: rgba(255,255,255,0.85); line-height: 1.45; max-width: 780px;">
            Every character has an <strong style="color: #ff9f0a;">origin</strong>, a <strong style="color: #ff2d55;">radical</strong>, and a strict <strong style="color: #30d158;">stroke rhythm</strong>.
          </div>
        </div>
      `, "#ff2d55", "Visual Anatomy • 汉字解构"),

      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 20px; font-weight: 800; color: #ff2d55; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">Calligraphy Engine</div>
          <h2 style="font-size: 54px; font-weight: 800; margin-bottom: 40px;">Trace Stroke by Stroke</h2>
          <div style="display: flex; justify-content: center; transform: scale(1.02); margin-bottom: 30px;">
            ${getDeviceFrame(studyScreenB64, 460, 980)}
          </div>
          <div style="font-size: 24px; color: rgba(255,255,255,0.8); font-weight: 600;">
            Tian Zi Ge Guide Grid • Strict Stroke Validation
          </div>
        </div>
      `, "#ff2d55", "Stroke Order • 笔画顺序"),

      getReelBaseHtml(
        getCtaScreenHtml(
          "Master 600+",
          "Essential Hanzi",
          "Available offline on iOS & Web. Trace, memorize, and recall effortlessly.",
          "Get Learn Chinese Today",
          "linear-gradient(135deg, #ff2d55, #ff9f0a)",
          "rgba(255, 45, 85, 0.45)"
        ),
        "#ff2d55",
        "Learn Chinese Today • 学中文"
      )
    ],
    "reel2_visual_hanzi.mp3",
    10,
    "smoothleft"
  );

  // 3. REEL 3: Contextual Phrases in Action (10s)
  await buildReelVideo(
    browser,
    "reel3-phrases-action-10s",
    [
      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 22px; font-weight: 800; color: #30d158; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;">Real Communication</div>
          <h1 style="font-size: 66px; line-height: 1.15; font-weight: 800; margin-bottom: 40px; letter-spacing: -1.5px;">
            Stop Memorizing<br />Isolated Words.
          </h1>
          <div style="padding: 28px 40px; border-radius: 28px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); font-size: 32px; color: rgba(255,255,255,0.85); line-height: 1.45; max-width: 780px;">
            Learn complete sentences with <strong style="color: #30d158;">natural syntax</strong>, <strong style="color: #0a84ff;">native tone accuracy</strong>, and <strong style="color: #ff9f0a;">tactile puzzles</strong>.
          </div>
        </div>
      `, "#30d158", "Contextual Grammar • 句型拼图"),

      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 20px; font-weight: 800; color: #30d158; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px;">Interactive Gameplay</div>
          <h2 style="font-size: 54px; font-weight: 800; margin-bottom: 40px;">Assemble Like a Puzzle</h2>
          <div style="display: flex; justify-content: center; transform: scale(1.02); margin-bottom: 30px;">
            ${getDeviceFrame(phrasesScreenB64, 460, 980)}
          </div>
          <div style="font-size: 24px; color: #30d158; font-weight: 700;">
            Immediate grammar syntax validation
          </div>
        </div>
      `, "#30d158", "Sentence Puzzle • 完整句子"),

      getReelBaseHtml(
        getCtaScreenHtml(
          "Speak Natural",
          "Mandarin Everyday",
          "Hundreds of curated sentences categorized by difficulty. Built for lasting retention.",
          "Start Playing Today",
          "linear-gradient(135deg, #30d158, #0a84ff)",
          "rgba(48, 209, 88, 0.45)"
        ),
        "#30d158",
        "Learn Chinese Today • 学中文"
      )
    ],
    "reel3_phrases_action.mp3",
    10,
    "slideleft"
  );

  // 4. REEL 4: Feature Focus - Phrase Game (12s)
  await buildReelVideo(
    browser,
    "reel4-phrase-game-12s",
    [
      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="width: 100px; height: 100px; border-radius: 28px; background: rgba(255, 159, 10, 0.2); display: flex; align-items: center; justify-content: center; font-size: 54px; margin: 0 auto 30px auto;">🧩</div>
          <h1 style="font-size: 72px; line-height: 1.15; font-weight: 800; margin-bottom: 24px; letter-spacing: -1.5px;">The Phrase Game</h1>
          <p style="font-size: 30px; color: rgba(255,255,255,0.75); line-height: 1.45; max-width: 740px;">
            Turn sentence building into an addictive tactile puzzle. Arrange Chinese characters into authentic grammar structures.
          </p>
        </div>
      `, "#ff9f0a", "Featured Mode • 句型拼图"),

      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 20px; font-weight: 800; color: #ff9f0a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Sentence Target</div>
          <div style="font-size: 36px; font-weight: 800; margin-bottom: 30px;">"I am learning Chinese."</div>
          
          <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 40px;">
            <div style="width: 140px; height: 160px; border-radius: 24px; background: rgba(255, 159, 10, 0.2); border: 2px solid #ff9f0a; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 48px; font-weight: 800;">我</span>
              <span style="font-size: 20px; color: #ff9f0a; font-weight: 600; margin-top: 4px;">wǒ</span>
            </div>
            <div style="width: 140px; height: 160px; border-radius: 24px; background: rgba(255, 159, 10, 0.2); border: 2px solid #ff9f0a; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 48px; font-weight: 800;">在</span>
              <span style="font-size: 20px; color: #ff9f0a; font-weight: 600; margin-top: 4px;">zài</span>
            </div>
            <div style="width: 140px; height: 160px; border-radius: 24px; background: rgba(255, 159, 10, 0.2); border: 2px solid #ff9f0a; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 48px; font-weight: 800;">学</span>
              <span style="font-size: 20px; color: #ff9f0a; font-weight: 600; margin-top: 4px;">xué</span>
            </div>
            <div style="width: 140px; height: 160px; border-radius: 24px; background: rgba(255, 159, 10, 0.2); border: 2px solid #ff9f0a; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 44px; font-weight: 800;">中文</span>
              <span style="font-size: 18px; color: #ff9f0a; font-weight: 600; margin-top: 4px;">zhōngwén</span>
            </div>
          </div>

          <div style="display: flex; justify-content: center; transform: scale(0.95);">
            ${getDeviceFrame(phrasesScreenB64, 440, 920)}
          </div>
        </div>
      `, "#ff9f0a", "Interactive Puzzle • 实时拼图"),

      getReelBaseHtml(
        getCtaScreenHtml(
          "Master Grammar",
          "Through Play",
          "Play the Phrase Game anytime on iOS and Web. Native audio, zero guesswork.",
          "Play Phrase Game Now",
          "linear-gradient(135deg, #ff9f0a, #ff3b30)",
          "rgba(255, 159, 10, 0.45)"
        ),
        "#ff9f0a",
        "The Phrase Game • 句型拼图"
      )
    ],
    "reel4_phrase_game.mp3",
    12,
    "fade"
  );

  // 5. REEL 5: Feature Focus - Hanzi Widget (12s)
  await buildReelVideo(
    browser,
    "reel5-widget-home-12s",
    [
      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="width: 100px; height: 100px; border-radius: 28px; background: rgba(10, 132, 255, 0.2); display: flex; align-items: center; justify-content: center; font-size: 54px; margin: 0 auto 30px auto;">📲</div>
          <h1 style="font-size: 68px; line-height: 1.15; font-weight: 800; margin-bottom: 24px; letter-spacing: -1.5px;">
            Hanzi on Your<br /><span style="background: linear-gradient(135deg, #0a84ff, #5e5ce6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">iPhone Home Screen</span>
          </h1>
          <p style="font-size: 28px; color: rgba(255,255,255,0.75); line-height: 1.45; max-width: 720px;">
            Passive spaced repetition. Every time you unlock your phone, a new Hanzi reinforces your memory automatically.
          </p>
        </div>
      `, "#0a84ff", "iOS Widgets • 桌面小组件"),

      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 20px; font-weight: 800; color: #0a84ff; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Native WidgetKit</div>
          <div style="font-size: 38px; font-weight: 800; margin-bottom: 40px;">Lock Screen & Home Screen</div>
          <div style="display: flex; flex-direction: column; gap: 30px; align-items: center;">
            ${getWidgetHtml("水", "shuǐ", "Water, liquid", "水 (water)", "HSK 1", "#0a84ff")}
            ${getWidgetHtml("山", "shān", "Mountain, hill", "山 (mountain)", "HSK 1", "#30d158")}
          </div>
        </div>
      `, "#0a84ff", "Spaced Repetition • 间隔记忆"),

      getReelBaseHtml(
        getCtaScreenHtml(
          "Learn Passively,",
          "Remember Forever",
          "Add Learn Chinese Today widgets to your iOS Home Screen today.",
          "Add Widgets to iPhone",
          "linear-gradient(135deg, #0a84ff, #5e5ce6)",
          "rgba(10, 132, 255, 0.45)"
        ),
        "#0a84ff",
        "iOS Widgets • 桌面小组件"
      )
    ],
    "reel5_widget_home.mp3",
    12,
    "circlecrop"
  );

  // 6. REEL 6: Feature Focus - Stroke Order & Calligraphy (12s)
  await buildReelVideo(
    browser,
    "reel6-stroke-calligraphy-12s",
    [
      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="width: 100px; height: 100px; border-radius: 28px; background: rgba(255, 59, 48, 0.2); display: flex; align-items: center; justify-content: center; font-size: 54px; margin: 0 auto 30px auto;">✍️</div>
          <h1 style="font-size: 68px; line-height: 1.15; font-weight: 800; margin-bottom: 24px; letter-spacing: -1.5px;">
            Calligraphy Is<br /><span style="background: linear-gradient(135deg, #ff453a, #ff9f0a); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Choreography</span>
          </h1>
          <p style="font-size: 28px; color: rgba(255,255,255,0.75); line-height: 1.45; max-width: 720px;">
            Master the ancient rhythm of Chinese writing with guided vector stroke animation and real-time validation.
          </p>
        </div>
      `, "#ff453a", "Stroke Order Engine • 笔画动画"),

      getReelBaseHtml(`
        <div style="text-align: center; z-index: 10;">
          <div style="font-size: 20px; font-weight: 800; color: #ff453a; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">Vector Stroke Engine</div>
          <h2 style="font-size: 50px; font-weight: 800; margin-bottom: 30px;">Precision Stroke by Stroke</h2>
          
          <div style="width: 580px; border-radius: 48px; background: linear-gradient(145deg, rgba(32, 34, 42, 0.96), rgba(16, 17, 24, 0.96)); border: 1px solid rgba(255, 59, 48, 0.45); box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7); padding: 40px; margin: 0 auto 30px auto; display: flex; flex-direction: column; align-items: center;">
            <svg viewBox="0 0 1024 1024" style="width: 320px; height: 320px; transform: scaleY(-1);">
              <g stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="8 8">
                <line x1="0" y1="512" x2="1024" y2="512" />
                <line x1="512" y1="0" x2="512" y2="1024" />
                <rect x="10" y="10" width="1004" height="1004" fill="none" stroke-width="4" stroke-dasharray="none" />
              </g>
              <path d="M480 880 c-10 -30 -20 -60 -30 -90 c-8 -20 -18 -20 -35 -5 c-18 18 -40 34 -65 48 c-15 8 -24 6 -30 -10 c-14 -38 -32 -76 -52 -112 c-8 -14 -4 -25 12 -30 c30 -10 60 -16 92 -18 c95 -5 155 45 185 150 c6 22 1 30 -22 38 c-20 8 -40 20 -62 38 z" fill="#ff3b30" />
              <path d="M180 620 l664 0 c15 0 25 8 25 22 c0 14 -10 22 -25 22 l-664 0 c-15 0 -25 -8 -25 -22 c0 -14 10 -22 25 -22 z" fill="#ff3b30" />
              <path d="M620 540 c-50 -80 -115 -155 -190 -220 c-55 -48 -115 -90 -180 -125 c-15 -8 -18 -18 -8 -28 c10 -10 20 -8 35 2 c75 42 145 92 210 150 c85 75 155 160 210 255 c8 14 6 24 -6 30 c-12 6 -24 4 -32 -10 c-12 -18 -25 -36 -39 -54 z" fill="#ff3b30" />
              <path d="M360 440 c55 -55 115 -105 180 -150 c75 -52 155 -92 240 -120 c18 -6 28 -2 30 12 c2 14 -6 22 -24 28 c-80 28 -155 68 -225 118 c-60 42 -115 90 -165 142 c-10 10 -20 12 -28 4 c-8 -8 -8 -20 -8 -34 z" fill="#ff3b30" />
            </svg>
            <div style="font-size: 50px; font-weight: 800; margin-top: 16px;">文 • <span style="color: #ff9f0a;">wén</span></div>
            <div style="font-size: 24px; color: rgba(255,255,255,0.7); margin-top: 4px;">Language, Writing, Culture</div>
          </div>
          
          <div style="font-size: 22px; color: rgba(255,255,255,0.75);">
            600+ characters with official Hanzi Writer vector strokes
          </div>
        </div>
      `, "#ff453a", "Vector Calligraphy • 笔画引擎"),

      getReelBaseHtml(
        getCtaScreenHtml(
          "Learn to Write",
          "Real Chinese",
          "Trace 600+ characters with accurate stroke orders. Available offline on iOS.",
          "Download Free on App Store"
        ),
        "#ff453a",
        "Learn Chinese Today • 学中文"
      )
    ],
    "reel6_stroke_calligraphy.mp3",
    12,
    "wipeleft"
  );

  await browser.close();

  // 7. Render Store Animated Videos (Header & Search)
  await buildStoreVideo(
    join(ascDir, "header-3840x1646.png"),
    "store_ambient_header.mp3",
    10,
    join(ascDir, "header-3840x1646.mp4")
  );

  await buildStoreVideo(
    join(ascDir, "search-3840x2560.png"),
    "store_ambient_header.mp3",
    10,
    join(ascDir, "search-3840x2560.mp4")
  );

  console.log("Creative videos build complete!");
}

run().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
