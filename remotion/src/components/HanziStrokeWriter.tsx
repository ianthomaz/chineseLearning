import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface HanziStrokeWriterProps {
  strokes: string[];
  size?: number;
  color?: string;
  gridColor?: string;
  startFrame?: number;
  durationFrames?: number;
  showGrid?: boolean;
}

export const HanziStrokeWriter: React.FC<HanziStrokeWriterProps> = ({
  strokes,
  size = 400,
  color = "#ff3b30",
  gridColor = "rgba(255, 255, 255, 0.15)",
  startFrame = 0,
  durationFrames = 120,
  showGrid = true,
}) => {
  const frame = useCurrentFrame();
  const currentRelFrame = Math.max(0, frame - startFrame);

  const totalStrokes = strokes.length;
  const framesPerStroke = durationFrames / Math.max(1, totalStrokes);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 1024 1024"
        style={{
          width: size,
          height: size,
          transform: "scaleY(-1)", // HanziWriter coordinate system is flipped Y
        }}
      >
        {/* Calligraphy Guide Grid (Tian Zi Ge / Mi Zi Ge) */}
        {showGrid && (
          <g stroke={gridColor} strokeWidth="2" strokeDasharray="8 8" opacity="0.7">
            <line x1="0" y1="512" x2="1024" y2="512" />
            <line x1="512" y1="0" x2="512" y2="1024" />
            <line x1="0" y1="0" x2="1024" y2="1024" />
            <line x1="0" y1="1024" x2="1024" y2="0" />
            <rect x="10" y="10" width="1004" height="1004" fill="none" strokeWidth="4" strokeDasharray="none" />
          </g>
        )}

        {/* Render strokes sequentially */}
        {strokes.map((d, index) => {
          const strokeStart = index * framesPerStroke;
          const strokeEnd = strokeStart + framesPerStroke;

          if (currentRelFrame < strokeStart) {
            return null; // Stroke hasn't begun yet
          }

          const progress = Math.min(
            1,
            Math.max(0, (currentRelFrame - strokeStart) / (framesPerStroke * 0.85))
          );

          // Full opacity once drawn, or active writing glow
          const isWriting = currentRelFrame >= strokeStart && currentRelFrame < strokeEnd;

          return (
            <path
              key={index}
              d={d}
              fill={color}
              opacity={progress}
              style={{
                transition: "opacity 0.05s linear",
                filter: isWriting ? "drop-shadow(0 0 12px rgba(255, 59, 48, 0.8))" : "none",
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};
