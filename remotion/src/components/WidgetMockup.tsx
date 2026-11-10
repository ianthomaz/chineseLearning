import React from "react";

interface WidgetMockupProps {
  hanzi: string;
  pinyin: string;
  meaning: string;
  radical?: string;
  level?: string;
  scale?: number;
}

export const WidgetMockup: React.FC<WidgetMockupProps> = ({
  hanzi,
  pinyin,
  meaning,
  radical = "女 (female)",
  level = "HSK 1",
  scale = 1.0,
}) => {
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        width: 480,
        height: 580,
        borderRadius: 40,
        background: "#FFFFFF",
        border: "1.5px solid rgba(190, 165, 130, 0.35)",
        boxShadow: "0 30px 70px rgba(80, 55, 30, 0.16)",
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      {/* Widget Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#B8332A" }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#8A7E6C", letterSpacing: 2 }}>
            DAILY HANZI
          </span>
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 12,
            background: "rgba(184, 51, 42, 0.1)",
            color: "#B8332A",
          }}
        >
          {level}
        </span>
      </div>

      {/* Main Character Focus (PingFang SC) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "10px 0" }}>
        <span
          style={{
            fontFamily: "'PingFang SC', -apple-system, 'Noto Sans SC', sans-serif",
            fontSize: 180,
            fontWeight: 600,
            lineHeight: 1,
            color: "#1C1B18",
          }}
        >
          {hanzi}
        </span>
        <span
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: "#B8332A",
            marginTop: 12,
            letterSpacing: 1,
          }}
        >
          {pinyin}
        </span>
      </div>

      {/* Widget Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          borderTop: "1.5px solid rgba(190, 165, 130, 0.25)",
          paddingTop: 20,
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 14, color: "#8A7E6C", textTransform: "uppercase", letterSpacing: 1 }}>Meaning</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "#1C1B18", marginTop: 2 }}>{meaning}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "#8A7E6C", textTransform: "uppercase", letterSpacing: 1 }}>Radical</div>
          <div style={{ fontFamily: "'PingFang SC', sans-serif", fontSize: 22, fontWeight: 500, color: "#4A443B", marginTop: 2 }}>{radical}</div>
        </div>
      </div>
    </div>
  );
};
