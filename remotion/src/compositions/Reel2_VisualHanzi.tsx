import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HanziStrokeWriter } from "../components/HanziStrokeWriter";

export const Reel2VisualHanzi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing:
  // 0 - 80: Hook ("Don't memorize blindly. Understand the anatomy.")
  // 80 - 210: Live Calligraphy & Breakdown ('爱' ài - Love)
  // 210 - 300: CTA & App Store

  const s1Fade = interpolate(frame, [0, 15, 65, 80], [0, 1, 1, 0]);
  const s2Fade = interpolate(frame, [80, 95, 195, 210], [0, 1, 1, 0]);
  const s3Fade = interpolate(frame, [210, 225, 300], [0, 1, 1]);

  // Strokes for '爱' (ài - love)
  const aiStrokes = [
    "M460 920 c-15 -35 -28 -70 -40 -105 c-8 -22 -18 -22 -35 -5 c-20 20 -45 38 -70 52 c-15 9 -24 7 -30 -10 c-15 -42 -35 -83 -58 -122 c-8 -14 -4 -25 12 -31 c32 -11 65 -18 99 -20 c102 -6 170 48 203 162 c6 23 1 32 -22 41 c-23 9 -45 22 -69 41 z",
    "M640 850 c-10 -30 -20 -60 -32 -90 c-12 -30 -26 -58 -41 -86 c-10 -18 -5 -28 15 -33 c31 -9 63 -14 96 -16 c85 -5 146 34 182 121 c9 21 4 32 -18 39 c-21 6 -42 19 -63 37 c-26 22 -49 31 -75 19 c-21 -10 -38 -11 -61 10 z",
    "M210 650 l600 0 c15 0 25 8 25 22 c0 14 -10 22 -25 22 l-600 0 c-15 0 -25 -8 -25 -22 c0 -14 10 -22 25 -22 z",
    "M360 540 c120 -12 250 -20 390 -20 c16 0 26 8 26 22 c0 14 -10 22 -26 22 c-140 0 -270 8 -390 20 c-16 2 -26 -6 -28 -20 c-2 -14 6 -22 28 -24 z",
    "M490 500 l0 -150 c0 -15 8 -24 22 -24 c14 0 22 9 22 24 l0 150 c0 15 -8 24 -22 24 c-14 0 -22 -9 -22 -24 z",
    "M280 320 c160 -15 340 -25 530 -25 c18 0 28 8 28 22 c0 14 -10 22 -28 22 c-190 0 -370 10 -530 25 c-18 2 -28 -6 -30 -20 c-2 -14 6 -22 30 -24 z",
    "M390 260 c-30 -60 -65 -115 -105 -165 c-12 -15 -8 -26 10 -24 c40 4 75 18 105 42 c80 64 120 145 130 240 c2 16 -8 24 -22 24 c-14 0 -24 -8 -26 -24 c-8 -60 -36 -120 -92 -170 z",
    "M620 270 c45 -65 85 -125 120 -185 c10 -17 22 -15 32 2 c25 45 42 95 50 148 c6 40 -12 60 -45 58 c-40 -2 -80 -7 -120 -15 c-18 -4 -25 -14 -15 -28 c12 -18 22 -36 32 -55 c-20 25 -42 50 -68 75 z"
  ];

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "radial-gradient(circle at 50% 30%, #1a1622 0%, #0d0e14 60%, #06070a 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: 350,
          left: "50%",
          transform: "translateX(-50%)",
          width: 850,
          height: 850,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 45, 85, 0.22) 0%, rgba(255, 106, 0, 0.08) 50%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* TOP BRAND HEADER */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            padding: "8px 22px",
            borderRadius: 30,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Visual Hanzi Anatomy • 汉字解构
        </div>
      </div>

      {/* SCENE 1: HOOK (Frames 0-80) */}
      {frame < 85 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: s1Fade,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 70px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#ff375f",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Smarter Learning
          </div>
          <h1
            style={{
              fontSize: 66,
              lineHeight: 1.15,
              fontWeight: 800,
              margin: "0 0 40px 0",
              letterSpacing: -1.5,
            }}
          >
            Chinese Characters
            <br />
            Aren't Random Lines.
          </h1>

          <div
            style={{
              padding: "24px 36px",
              borderRadius: 24,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 32,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.4,
              maxWidth: 760,
            }}
          >
            Every character has an <strong style={{ color: "#ff9f0a" }}>origin</strong>, a{" "}
            <strong style={{ color: "#ff375f" }}>radical</strong>, and a strict{" "}
            <strong style={{ color: "#30d158" }}>stroke rhythm</strong>.
          </div>
        </div>
      )}

      {/* SCENE 2: LIVE CALLIGRAPHY BREAKDOWN (Frames 80-210) */}
      {frame >= 75 && frame < 215 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: s2Fade,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 60px",
          }}
        >
          {/* Hanzi Calligraphy Card */}
          <div
            style={{
              width: 680,
              borderRadius: 48,
              background: "linear-gradient(145deg, rgba(30, 32, 40, 0.96), rgba(15, 16, 22, 0.96))",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 55, 95, 0.4)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 55, 95, 0.25)",
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#ff375f",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Stroke-by-Stroke Engine
            </div>

            <HanziStrokeWriter
              strokes={aiStrokes}
              size={360}
              color="#ff2d55"
              startFrame={85}
              durationFrames={100}
            />

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: "#ffffff" }}>
                爱 • <span style={{ color: "#ff9f0a" }}>ài</span>
              </div>
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                Meaning: Love, Affection
              </div>
            </div>

            {/* Radical & Structure Tags */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 32,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "10px 20px",
                  borderRadius: 16,
                  background: "rgba(255, 255, 255, 0.08)",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Radical: 爫 (claw)
              </div>
              <div
                style={{
                  padding: "10px 20px",
                  borderRadius: 16,
                  background: "rgba(255, 255, 255, 0.08)",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Strokes: 10
              </div>
              <div
                style={{
                  padding: "10px 20px",
                  borderRadius: 16,
                  background: "rgba(255, 55, 95, 0.2)",
                  color: "#ff375f",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                HSK 1
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 3: CTA (Frames 210-300) */}
      {frame >= 205 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: s3Fade,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 60px",
            textAlign: "center",
          }}
        >
          <img
            src="/appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
            alt="App Icon"
            style={{
              width: 170,
              height: 170,
              borderRadius: 40,
              boxShadow: "0 25px 60px rgba(255, 45, 85, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
              marginBottom: 40,
            }}
          />

          <h2 style={{ fontSize: 64, fontWeight: 800, margin: "0 0 20px 0", letterSpacing: -1.5 }}>
            Master 600+
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ff2d55, #ff9f0a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Essential Hanzi
            </span>
          </h2>

          <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 620, marginBottom: 50 }}>
            Available offline on iOS & Web. Trace, memorize, and recall effortlessly.
          </p>

          <div
            style={{
              padding: "22px 60px",
              borderRadius: 36,
              background: "linear-gradient(135deg, #ff2d55, #ff375f)",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: "0 20px 45px rgba(255, 45, 85, 0.45)",
            }}
          >
            Get Learn Chinese Today
          </div>
        </div>
      )}
    </div>
  );
};
