import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../components/DeviceFrame";
import { WidgetMockup } from "../components/WidgetMockup";

export const Reel1DailyRoutine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene timing (300 frames total = 10 seconds @ 30fps)
  // 0 - 90: Scene 1 (Hook & Widget Routine)
  // 90 - 210: Scene 2 (In-App Streak & Phrase Practice)
  // 210 - 300: Scene 3 (CTA & App Icon)

  const s1Fade = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0]);
  const s2Fade = interpolate(frame, [90, 105, 195, 210], [0, 1, 1, 0]);
  const s3Fade = interpolate(frame, [210, 225, 300], [0, 1, 1]);

  const float = Math.sin(frame * 0.08) * 8;

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "radial-gradient(circle at 50% 35%, #181922 0%, #0c0d12 60%, #060608 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 59, 48, 0.22) 0%, rgba(255, 159, 10, 0.08) 50%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* TOP HEADER: Brand watermark */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          zIndex: 20,
        }}
      >
        <div
          style={{
            padding: "8px 20px",
            borderRadius: 30,
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.9)",
            textTransform: "uppercase",
          }}
        >
          Learn Chinese Today • 学中文
        </div>
      </div>

      {/* SCENE 1: HOOK & WIDGET ON SCREEN (Frames 0-90) */}
      {frame < 95 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: s1Fade,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 60px",
            boxSizing: "border-box",
          }}
        >
          {/* Kinetic Hook Headline */}
          <div style={{ textAlign: "center", marginBottom: 70 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#ff453a",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Microlearning Habit
            </div>
            <h1
              style={{
                fontSize: 64,
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: -1.5,
                margin: 0,
              }}
            >
              Learn Mandarin in
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #ff453a, #ff9f0a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                5 Minutes a Day.
              </span>
            </h1>
          </div>

          {/* Floating Widget Showcase */}
          <div style={{ transform: `translateY(${float}px)` }}>
            <WidgetMockup
              hanzi="好"
              pinyin="hǎo"
              meaning="Good, fine, well"
              radical="女 (female)"
              level="HSK 1"
              scale={1.4}
              elevation={30}
            />
          </div>

          <p
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
              marginTop: 60,
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            Directly from your iPhone Lock & Home Screen. Effortless daily exposure.
          </p>
        </div>
      )}

      {/* SCENE 2: IN-APP FLOW (Frames 90-210) */}
      {frame >= 85 && frame < 215 && (
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
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#ff453a",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Interactive Daily Session
            </div>
            <h2
              style={{
                fontSize: 56,
                fontWeight: 800,
                letterSpacing: -1,
                margin: 0,
              }}
            >
              Practice Real Sentences
            </h2>
          </div>

          {/* Phone Frame */}
          <div style={{ transform: "scale(1.02)" }}>
            <DeviceFrame
              imageSrc="/appMobile/store/screenshots/iphone-67/03-phrases.png"
              width={420}
              height={900}
            />
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(255, 59, 48, 0.15)",
              border: "1px solid rgba(255, 59, 48, 0.3)",
              padding: "12px 28px",
              borderRadius: 30,
            }}
          >
            <span style={{ fontSize: 24 }}>✨</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
              Active recall with instant audio feedback
            </span>
          </div>
        </div>
      )}

      {/* SCENE 3: CTA & BRAND FINALE (Frames 210-300) */}
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
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <img
            src="/appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
            alt="App Icon"
            style={{
              width: 180,
              height: 180,
              borderRadius: 42,
              boxShadow: "0 30px 70px rgba(255, 59, 48, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
              marginBottom: 40,
            }}
          />

          <h2
            style={{
              fontSize: 68,
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: -1.5,
              margin: "0 0 20px 0",
            }}
          >
            Start Your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ff453a, #ff9f0a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Mandarin Journey
            </span>
          </h2>

          <p
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 600,
              lineHeight: 1.4,
              marginBottom: 60,
            }}
          >
            Available now on iPhone, iPad & Web. No subscriptions required to start.
          </p>

          <div
            style={{
              padding: "24px 64px",
              borderRadius: 40,
              background: "linear-gradient(135deg, #ff453a, #ff2d55)",
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: "0 20px 50px rgba(255, 59, 48, 0.5)",
            }}
          >
            Download on App Store
          </div>
        </div>
      )}
    </div>
  );
};
