import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WidgetMockup } from "../components/WidgetMockup";

export const Reel5WidgetHome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 360 frames = 12 seconds
  // 0 - 80: Hook ("Turn your iPhone Screen into a Passive Learning Engine")
  // 80 - 240: Widget Showcase (Medium and Small widget cycle)
  // 240 - 360: CTA

  const s1Fade = interpolate(frame, [0, 15, 65, 80], [0, 1, 1, 0]);
  const s2Fade = interpolate(frame, [80, 95, 230, 245], [0, 1, 1, 0]);
  const s3Fade = interpolate(frame, [245, 260, 360], [0, 1, 1]);

  const float1 = Math.sin(frame * 0.06) * 10;
  const float2 = Math.cos(frame * 0.06) * 10;

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "radial-gradient(circle at 50% 30%, #151922 0%, #0d0f16 60%, #050608 100%)",
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
          background: "radial-gradient(circle, rgba(10, 132, 255, 0.22) 0%, rgba(94, 92, 230, 0.08) 50%, transparent 70%)",
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
            color: "#0a84ff",
          }}
        >
          iOS Widgets • 桌面小组件
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
              background: "rgba(10, 132, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              marginBottom: 24,
            }}
          >
            📲
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
            Hanzi on Your
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #0a84ff, #5e5ce6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              iPhone Home Screen
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
            Passive spaced repetition. Every time you unlock your phone, a new Hanzi reinforces your memory automatically.
          </p>
        </div>
      )}

      {/* SCENE 2: WIDGET SHOWCASE (Frames 80-245) */}
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
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0a84ff", letterSpacing: 2, textTransform: "uppercase" }}>
              Native WidgetKit Integration
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>
              Lock Screen & Home Screen
            </div>
          </div>

          {/* Dual Widget Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center" }}>
            <div style={{ transform: `translateY(${float1}px)` }}>
              <WidgetMockup
                hanzi="水"
                pinyin="shuǐ"
                meaning="Water, liquid"
                radical="水 (water)"
                level="HSK 1"
                scale={1.35}
                elevation={35}
              />
            </div>

            <div style={{ transform: `translateY(${float2}px)` }}>
              <WidgetMockup
                hanzi="山"
                pinyin="shān"
                meaning="Mountain, hill"
                radical="山 (mountain)"
                level="HSK 1"
                scale={1.35}
                elevation={35}
              />
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
              boxShadow: "0 25px 60px rgba(10, 132, 255, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
              marginBottom: 40,
            }}
          />

          <h2 style={{ fontSize: 64, fontWeight: 800, margin: "0 0 20px 0", letterSpacing: -1.5 }}>
            Learn Passively,
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #0a84ff, #5e5ce6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Remember Forever
            </span>
          </h2>

          <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 620, marginBottom: 50 }}>
            Add Learn Chinese Today widgets to your iOS Home Screen today.
          </p>

          <div
            style={{
              padding: "22px 60px",
              borderRadius: 36,
              background: "linear-gradient(135deg, #0a84ff, #5e5ce6)",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: "0 20px 45px rgba(10, 132, 255, 0.45)",
            }}
          >
            Add Widgets to iPhone
          </div>
        </div>
      )}
    </div>
  );
};
