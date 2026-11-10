import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../components/DeviceFrame";

export const Reel3PhrasesAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing:
  // 0 - 80: Hook ("Single words fail in conversations. Sentences work.")
  // 80 - 210: Phrase Game in action (assembling '我是巴西人' or '我想学中文')
  // 210 - 300: CTA

  const s1Fade = interpolate(frame, [0, 15, 65, 80], [0, 1, 1, 0]);
  const s2Fade = interpolate(frame, [80, 95, 195, 210], [0, 1, 1, 0]);
  const s3Fade = interpolate(frame, [210, 225, 300], [0, 1, 1]);

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "radial-gradient(circle at 50% 30%, #151824 0%, #0c0e15 60%, #06070a 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 350,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(10, 132, 255, 0.2) 0%, rgba(48, 209, 88, 0.08) 50%, transparent 70%)",
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
          Contextual Grammar • 句子训练
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
              color: "#30d158",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Real Conversation
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
            Stop Memorizing
            <br />
            Isolated Words.
          </h1>

          <div
            style={{
              padding: "26px 36px",
              borderRadius: 24,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: 32,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.4,
              maxWidth: 760,
            }}
          >
            Learn complete sentences with{" "}
            <strong style={{ color: "#30d158" }}>natural syntax</strong>,{" "}
            <strong style={{ color: "#0a84ff" }}>tone accuracy</strong>, and{" "}
            <strong style={{ color: "#ff9f0a" }}>active puzzles</strong>.
          </div>
        </div>
      )}

      {/* SCENE 2: INTERACTIVE PUZZLE SHOWCASE (Frames 80-210) */}
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
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <h2 style={{ fontSize: 52, fontWeight: 800, margin: 0 }}>
              Assemble Like a Puzzle
            </h2>
            <div style={{ fontSize: 22, color: "#30d158", fontWeight: 600, marginTop: 8 }}>
              Immediate syntax validation
            </div>
          </div>

          <DeviceFrame
            imageSrc="/appMobile/store/screenshots/iphone-67/03-phrases.png"
            width={430}
            height={920}
          />
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
              boxShadow: "0 25px 60px rgba(48, 209, 88, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
              marginBottom: 40,
            }}
          />

          <h2 style={{ fontSize: 64, fontWeight: 800, margin: "0 0 20px 0", letterSpacing: -1.5 }}>
            Speak Natural
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #30d158, #0a84ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Mandarin Everyday
            </span>
          </h2>

          <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 620, marginBottom: 50 }}>
            Hundreds of curated sentences categorized by difficulty. Built for lasting retention.
          </p>

          <div
            style={{
              padding: "22px 60px",
              borderRadius: 36,
              background: "linear-gradient(135deg, #30d158, #0a84ff)",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: "0 20px 45px rgba(48, 209, 88, 0.45)",
            }}
          >
            Start Playing Today
          </div>
        </div>
      )}
    </div>
  );
};
