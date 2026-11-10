import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../components/DeviceFrame";
import { HanziStrokeWriter } from "../components/HanziStrokeWriter";
import { WidgetMockup } from "../components/WidgetMockup";

export const StoreSearch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 15 } });
  const floatAnim = Math.sin(frame * 0.04) * 16;

  // Real stroke data for '中' (zhōng)
  const zhongStrokes = [
    "M250 720 l0 -420 c0 -20 15 -35 35 -35 l460 0 c20 0 35 15 35 35 l0 420 c0 20 -15 35 -35 35 l-460 0 c-20 0 -35 -15 -35 -35 z M310 325 l400 0 l0 340 l-400 0 z",
    "M485 920 l0 -820 c0 -20 15 -35 35 -35 c20 0 35 15 35 35 l0 820 c0 20 -15 35 -35 35 c-20 0 -35 -15 -35 -35 z"
  ];

  return (
    <div
      style={{
        width: 3840,
        height: 2560,
        background: "radial-gradient(ellipse at 50% 30%, #1c141d 0%, #0c0d12 60%, #06070a 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', sans-serif",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "160px 180px",
        boxSizing: "border-box",
      }}
    >
      {/* Background ambient red-amber radiance */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 2200,
          height: 1600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 59, 48, 0.16) 0%, rgba(255, 159, 10, 0.06) 50%, transparent 75%)",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      {/* Top Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 2400,
          zIndex: 10,
          transform: `translateY(${(1 - entrance) * 60}px)`,
          opacity: entrance,
        }}
      >
        {/* App Icon + Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 36 }}>
          <img
            src="/appMobile/ios/LearnChineseToday/Assets.xcassets/AppIcon.appiconset/AppIcon.png"
            alt="App Icon"
            style={{
              width: 140,
              height: 140,
              borderRadius: 32,
              boxShadow: "0 20px 50px rgba(255, 59, 48, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
            }}
          />
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 24px",
                borderRadius: 40,
                background: "rgba(255, 59, 48, 0.16)",
                border: "1px solid rgba(255, 59, 48, 0.4)",
                color: "#ff5247",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Learn Chinese Today • 学中文
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", marginTop: 8 }}>
              HSK 1-3 Everyday Mastery
            </div>
          </div>
        </div>

        {/* Big Search Catchphrase */}
        <h1
          style={{
            fontSize: 136,
            lineHeight: 1.05,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -3,
            background: "linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Read, Write & Speak
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #ff453a 0%, #ff9f0a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Real Mandarin Naturally.
          </span>
        </h1>

        <p
          style={{
            fontSize: 40,
            lineHeight: 1.4,
            color: "rgba(255, 255, 255, 0.7)",
            margin: "32px 0 0 0",
            maxWidth: 1900,
          }}
        >
          Dynamic character stroke writing, full phrase games, and instant widgets for lock & home screen.
        </p>
      </div>

      {/* Center Device Showcase with Floating Cards */}
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 8,
          margin: "40px 0",
        }}
      >
        {/* Left Floating Widget: Lock Screen / Home Hanzi */}
        <div
          style={{
            position: "absolute",
            left: 220,
            top: "50%",
            transform: `translateY(-50%) translateY(${-floatAnim}px)`,
            zIndex: 14,
          }}
        >
          <WidgetMockup
            hanzi="学"
            pinyin="xué"
            meaning="To study, learn"
            radical="子 (child)"
            level="HSK 1"
            scale={1.35}
            elevation={40}
          />
        </div>

        {/* Center Main Hero iPhone Frame */}
        <div
          style={{
            transform: `translateY(${floatAnim * 0.6}px) scale(1.05)`,
            zIndex: 12,
          }}
        >
          <DeviceFrame
            imageSrc="/appMobile/store/screenshots/iphone-67/02-home.png"
            width={640}
            height={1380}
          />
        </div>

        {/* Right Floating Calligraphy Card: Hanzi Stroke Animation */}
        <div
          style={{
            position: "absolute",
            right: 220,
            top: "50%",
            transform: `translateY(-50%) translateY(${floatAnim}px)`,
            zIndex: 14,
            width: 440,
            borderRadius: 48,
            background: "linear-gradient(145deg, rgba(32, 34, 42, 0.96), rgba(18, 19, 24, 0.96))",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 59, 48, 0.4)",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 59, 48, 0.25)",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 2,
              color: "#ff453a",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Live Stroke Order
          </div>
          <HanziStrokeWriter
            strokes={zhongStrokes}
            size={260}
            color="#ff3b30"
            startFrame={0}
            durationFrames={120}
          />
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>中 • zhōng</div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
              Middle, Center, China
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feature Pillars */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 60,
          width: "100%",
          zIndex: 10,
        }}
      >
        {[
          {
            title: "Sentence Puzzle Game",
            desc: "Drag and drop real sentences with immediate grammar feedback",
            icon: "🧩",
          },
          {
            title: "600+ Stroke Characters",
            desc: "Native vector calligraphy with strict stroke order guidance",
            icon: "✍️",
          },
          {
            title: "Home Screen Memorize",
            desc: "Spaced repetition widgets cycling characters throughout your day",
            icon: "📲",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              maxWidth: 820,
              padding: "36px 44px",
              borderRadius: 32,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 48,
                padding: "16px 20px",
                borderRadius: 20,
                background: "rgba(255, 59, 48, 0.15)",
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
