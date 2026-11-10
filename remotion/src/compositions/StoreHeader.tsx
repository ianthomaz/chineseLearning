import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../components/DeviceFrame";
import { HanziStrokeWriter } from "../components/HanziStrokeWriter";

export const StoreHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance springs
  const titleEntrance = spring({ frame, fps, config: { damping: 14 } });
  const devicesEntrance = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const cardFloat = Math.sin(frame * 0.05) * 12;

  // Real stroke data for '学' (study/learn)
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

  return (
    <div
      style={{
        width: 3840,
        height: 1646,
        background: "radial-gradient(circle at 75% 45%, #1f1520 0%, #0d0e14 55%, #07080b 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Ambient background glow and grid */}
      <div
        style={{
          position: "absolute",
          top: -300,
          right: 200,
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(235, 45, 36, 0.18) 0%, rgba(255, 106, 0, 0.05) 45%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Decorative Traditional Chinese Seal (印章) Watermark */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 160,
          opacity: 0.08,
          fontSize: 260,
          fontWeight: 900,
          fontFamily: "'PingFang SC', 'Noto Serif SC', serif",
          letterSpacing: 20,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        学中文
      </div>

      {/* Left Column: Branding, Value Prop & Badges */}
      <div
        style={{
          position: "absolute",
          left: 180,
          top: "50%",
          transform: `translateY(-50%) translateY(${(1 - titleEntrance) * 60}px)`,
          opacity: titleEntrance,
          maxWidth: 1550,
          zIndex: 10,
        }}
      >
        {/* App Icon + Category Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 40 }}>
          <img
            src="/appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
            alt="App Icon"
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              boxShadow: "0 16px 40px rgba(255, 59, 48, 0.35), 0 0 0 2px rgba(255,255,255,0.15)",
            }}
          />
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 20px",
                borderRadius: 40,
                background: "rgba(255, 59, 48, 0.15)",
                border: "1px solid rgba(255, 59, 48, 0.4)",
                color: "#ff5247",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3b30" }} />
              HSK 1-3 • Calligraphy • Widgets
            </div>
            <div style={{ fontSize: 26, color: "rgba(255,255,255,0.6)", marginTop: 6, fontWeight: 500 }}>
              today.learnchinese.app
            </div>
          </div>
        </div>

        {/* Master Headline */}
        <h1
          style={{
            fontSize: 108,
            lineHeight: 1.06,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -2,
            background: "linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Master Mandarin,
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #ff453a 0%, #ff9f0a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            One Hanzi at a Time.
          </span>
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontSize: 34,
            lineHeight: 1.45,
            color: "rgba(255, 255, 255, 0.72)",
            margin: "36px 0 52px 0",
            maxWidth: 1300,
            fontWeight: 400,
          }}
        >
          Stroke-by-stroke calligraphy animation, interactive phrase puzzles, and spaced repetition directly on your iPhone Home & Lock Screen.
        </p>

        {/* Key Feature Chips */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Interactive Stroke Order", icon: "✍️" },
            { label: "Phrase Game Puzzles", icon: "🧩" },
            { label: "iOS Desktop Widgets", icon: "📱" },
            { label: "Pinyin with Audio", icon: "🔊" },
          ].map((chip, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 28px",
                borderRadius: 20,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: 24,
                fontWeight: 600,
                backdropFilter: "blur(12px)",
              }}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: 3-Device Perspective Showcase */}
      <div
        style={{
          position: "absolute",
          right: 140,
          top: "50%",
          transform: `translateY(-50%) translateY(${(1 - devicesEntrance) * 80}px)`,
          opacity: devicesEntrance,
          display: "flex",
          alignItems: "center",
          gap: 40,
          zIndex: 8,
        }}
      >
        {/* Device 1: Phrases Game (Left tilt) */}
        <div style={{ transform: "translateY(50px) rotate(-8deg) scale(0.88)", transformOrigin: "bottom center" }}>
          <DeviceFrame
            imageSrc="/appMobile/store/screenshots/iphone-67/03-phrases.png"
            width={480}
            height={1040}
          />
        </div>

        {/* Device 2: Home Dashboard (Center Hero) */}
        <div
          style={{
            transform: `translateY(${cardFloat}px) scale(1.04)`,
            zIndex: 12,
            position: "relative",
          }}
        >
          <DeviceFrame
            imageSrc="/appMobile/store/screenshots/iphone-67/02-home.png"
            width={520}
            height={1120}
          />

          {/* Floating Calligraphy Stroke Badge */}
          <div
            style={{
              position: "absolute",
              bottom: 120,
              right: -130,
              width: 290,
              height: 290,
              borderRadius: 36,
              background: "rgba(20, 21, 28, 0.94)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 59, 48, 0.4)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 59, 48, 0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 18,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ff453a", letterSpacing: 1 }}>
              ACTIVE CALLIGRAPHY
            </div>
            <HanziStrokeWriter
              strokes={xueStrokes}
              size={180}
              color="#ff3b30"
              startFrame={0}
              durationFrames={120}
            />
            <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
              学 • xué (study)
            </div>
          </div>
        </div>

        {/* Device 3: Stroke & Study View (Right tilt) */}
        <div style={{ transform: "translateY(50px) rotate(8deg) scale(0.88)", transformOrigin: "bottom center" }}>
          <DeviceFrame
            imageSrc="/appMobile/store/screenshots/iphone-67/05-study.png"
            width={480}
            height={1040}
          />
        </div>
      </div>
    </div>
  );
};
