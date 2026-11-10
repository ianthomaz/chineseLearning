import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DeviceFrame } from "../components/DeviceFrame";

export const Reel4PhraseGame: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 360 frames = 12 seconds
  // 0 - 80: Intro / Feature Hook ("The Phrase Game: Learn by Solving")
  // 80 - 240: Interactive Game Simulation (Character tiles snapping into place)
  // 240 - 360: Result & Call to Action

  const s1Fade = interpolate(frame, [0, 15, 65, 80], [0, 1, 1, 0]);
  const s2Fade = interpolate(frame, [80, 95, 230, 245], [0, 1, 1, 0]);
  const s3Fade = interpolate(frame, [245, 260, 360], [0, 1, 1]);

  // Tile snap animations
  const tile1 = spring({ frame: frame - 100, fps, config: { damping: 12 } });
  const tile2 = spring({ frame: frame - 120, fps, config: { damping: 12 } });
  const tile3 = spring({ frame: frame - 140, fps, config: { damping: 12 } });
  const tile4 = spring({ frame: frame - 160, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        background: "radial-gradient(circle at 50% 30%, #171a26 0%, #0d0f17 60%, #06070a 100%)",
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
          top: 300,
          left: "50%",
          transform: "translateX(-50%)",
          width: 850,
          height: 850,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 159, 10, 0.22) 0%, rgba(255, 59, 48, 0.08) 50%, transparent 70%)",
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
            color: "#ff9f0a",
          }}
        >
          Featured Mode • 句型拼图
        </div>
      </div>

      {/* SCENE 1: FEATURE HOOK (Frames 0-80) */}
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
              background: "rgba(255, 159, 10, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              marginBottom: 24,
            }}
          >
            🧩
          </div>
          <h1
            style={{
              fontSize: 68,
              lineHeight: 1.15,
              fontWeight: 800,
              margin: "0 0 24px 0",
              letterSpacing: -1.5,
            }}
          >
            The Phrase Game
          </h1>
          <p
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.45,
              maxWidth: 720,
            }}
          >
            Turn sentence building into an addictive tactile puzzle. Arrange Chinese characters into authentic grammar structures.
          </p>
        </div>
      )}

      {/* SCENE 2: INTERACTIVE PUZZLE SIMULATION (Frames 80-245) */}
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
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ff9f0a", letterSpacing: 2, textTransform: "uppercase" }}>
              Sentence Target
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
              "I am learning Chinese."
            </div>
          </div>

          {/* Target Slots */}
          <div style={{ display: "flex", gap: 14, marginBottom: 50 }}>
            {[
              { char: "我", pinyin: "wǒ", progress: tile1 },
              { char: "在", pinyin: "zài", progress: tile2 },
              { char: "学", pinyin: "xué", progress: tile3 },
              { char: "中文", pinyin: "zhōngwén", progress: tile4 },
            ].map((slot, idx) => (
              <div
                key={idx}
                style={{
                  width: 140,
                  height: 160,
                  borderRadius: 24,
                  background: slot.progress > 0.5 ? "rgba(255, 159, 10, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: slot.progress > 0.5 ? "2px solid #ff9f0a" : "2px dashed rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${0.8 + slot.progress * 0.2})`,
                  opacity: Math.max(0.4, slot.progress),
                  transition: "background 0.2s",
                }}
              >
                {slot.progress > 0.5 ? (
                  <>
                    <span style={{ fontSize: 44, fontWeight: 800 }}>{slot.char}</span>
                    <span style={{ fontSize: 18, color: "#ff9f0a", marginTop: 4, fontWeight: 600 }}>
                      {slot.pinyin}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 24, color: "rgba(255,255,255,0.3)" }}>?</span>
                )}
              </div>
            ))}
          </div>

          {/* Phone Frame previewing actual in-app game */}
          <DeviceFrame
            imageSrc="/appMobile/store/screenshots/iphone-67/03-phrases.png"
            width={380}
            height={800}
          />
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
              boxShadow: "0 25px 60px rgba(255, 159, 10, 0.4), 0 0 0 2px rgba(255,255,255,0.2)",
              marginBottom: 40,
            }}
          />

          <h2 style={{ fontSize: 64, fontWeight: 800, margin: "0 0 20px 0", letterSpacing: -1.5 }}>
            Master Grammar
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #ff9f0a, #ff3b30)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Through Play
            </span>
          </h2>

          <p style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", maxWidth: 620, marginBottom: 50 }}>
            Play the Phrase Game anytime on iOS and Web. Native audio, zero guesswork.
          </p>

          <div
            style={{
              padding: "22px 60px",
              borderRadius: 36,
              background: "linear-gradient(135deg, #ff9f0a, #ff3b30)",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 1,
              boxShadow: "0 20px 45px rgba(255, 159, 10, 0.45)",
            }}
          >
            Play Phrase Game Now
          </div>
        </div>
      )}
    </div>
  );
};
