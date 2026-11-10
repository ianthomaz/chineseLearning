import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HanziStrokeWriter } from "../components/HanziStrokeWriter";

export const Reel6StrokeCalligraphy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 360 frames = 12 seconds
  // 0 - 80: Hook ("Calligraphy is choreography. Learn the exact stroke order.")
  // 80 - 245: Active Calligraphy Writing Demo ('中' & '文')
  // 245 - 360: CTA

  const s1Fade = interpolate(frame, [0, 15, 65, 80], [0, 1, 1, 0]);
  const s2Fade = interpolate(frame, [80, 95, 230, 245], [0, 1, 1, 0]);
  const s3Fade = interpolate(frame, [245, 260, 360], [0, 1, 1]);

  // Strokes for '文' (wén - culture, language)
  const wenStrokes = [
    "M480 880 c-10 -30 -20 -60 -30 -90 c-8 -20 -18 -20 -35 -5 c-18 18 -40 34 -65 48 c-15 8 -24 6 -30 -10 c-14 -38 -32 -76 -52 -112 c-8 -14 -4 -25 12 -30 c30 -10 60 -16 92 -18 c95 -5 155 45 185 150 c6 22 1 30 -22 38 c-20 8 -40 20 -62 38 z",
    "M180 620 l664 0 c15 0 25 8 25 22 c0 14 -10 22 -25 22 l-664 0 c-15 0 -25 -8 -25 -22 c0 -14 10 -22 25 -22 z",
    "M620 540 c-50 -80 -115 -155 -190 -220 c-55 -48 -115 -90 -180 -125 c-15 -8 -18 -18 -8 -28 c10 -10 20 -8 35 2 c75 42 145 92 210 150 c85 75 155 160 210 255 c8 14 6 24 -6 30 c-12 6 -24 4 -32 -10 c-12 -18 -25 -36 -39 -54 z",
    "M360 440 c55 -55 115 -105 180 -150 c75 -52 155 -92 240 -120 c18 -6 28 -2 30 12 c2 14 -6 22 -24 28 c-80 28 -155 68 -225 118 c-60 42 -115 90 -165 142 c-10 10 -20 12 -28 4 c-8 -8 -8 -20 -8 -34 z"
  ];

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "radial-gradient(circle at 50% 30%, #1a1520 0%, #0d0e14 60%, #06070a 100%)",
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
          background: "radial-gradient(circle, rgba(255, 59, 48, 0.22) 0%, rgba(255, 45, 85, 0.08) 50%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Top Header */}
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
            padding: "8px 24px",
            borderRadius: 30,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#ff453a",
          }}
        >
          Stroke Order Engine • 笔顺动态
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
              width: 90,
              height: 90,
              borderRadius: 24,
              background: "rgba(255, 59, 48, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              marginBottom: 24,
            }}
          >
            ✍️
          </div>
          <h1
            style={{
              fontSize: 66,
              lineHeight: 1.15,
              fontWeight: 800,
              margin: "0 0 24px 0",
              letterSpacing: -1.5,
            }}
          >
            Calligraphy Is
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ff453a, #ff9f0a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Choreography
            </span>
          </h1>
          <p
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.45,
              maxWidth: 720,
            }}
          >
            Master the ancient rhythm of Chinese writing with guided vector stroke animation and real-time validation.
          </p>
        </div>
      )}

      {/* SCENE 2: ACTIVE CALLIGRAPHY DEMO (Frames 80-245) */}
      {frame >= 75 && frame < 250 && (
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
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ff453a", letterSpacing: 2, textTransform: "uppercase" }}>
              Stroke by Stroke
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>
              Precision Vector Engine
            </div>
          </div>

          {/* Large Calligraphy Canvas */}
          <div
            style={{
              width: 680,
              borderRadius: 48,
              background: "linear-gradient(145deg, rgba(32, 34, 42, 0.96), rgba(16, 17, 24, 0.96))",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 59, 48, 0.4)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 59, 48, 0.25)",
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <HanziStrokeWriter
              strokes={wenStrokes}
              size={400}
              color="#ff3b30"
              startFrame={85}
              durationFrames={120}
              showGrid={true}
            />

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: "#ffffff" }}>
                文 • <span style={{ color: "#ff9f0a" }}>wén</span>
              </div>
              <div style={{ fontSize: 26, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                Language, Culture, Writing
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 28,
              }}
            >
              <div
                style={{
                  padding: "10px 22px",
                  borderRadius: 16,
                  background: "rgba(255, 59, 48, 0.15)",
                  color: "#ff453a",
                  fontSize: 18,
                  fontWeight: 700,
                  border: "1px solid rgba(255, 59, 48, 0.3)",
                }}
              >
                Tian Zi Ge Grid
              </div>
              <div
                style={{
                  padding: "10px 22px",
                  borderRadius: 16,
                  background: "rgba(255, 255, 255, 0.08)",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                4 Guided Strokes
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 3: CTA & DOWNLOAD (Frames 245-360) */}
      {frame >= 240 && (
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
              boxShadow: "0 25px 60px rgba(255, 59, 48, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
              marginBottom: 40,
            }}
          />

          <h2 style={{ fontSize: 64, fontWeight: 800, margin: "0 0 20px 0", letterSpacing: -1.5 }}>
            Learn to Write
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ff453a, #ff9f0a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Real Chinese
            </span>
          </h2>

          <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 620, marginBottom: 50 }}>
            Trace 600+ characters with accurate stroke orders. Available offline on iOS.
          </p>

          <div
            style={{
              padding: "22px 60px",
              borderRadius: 36,
              background: "linear-gradient(135deg, #ff453a, #ff9f0a)",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: "0 20px 45px rgba(255, 59, 48, 0.45)",
            }}
          >
            Download Free on App Store
          </div>
        </div>
      )}
    </div>
  );
};
