import React from "react";

interface DeviceFrameProps {
  imageSrc: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  scale?: number;
  rotation?: number;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  imageSrc,
  width = 420,
  height = 890,
  style = {},
  scale = 1.0,
  rotation = 0,
}) => {
  const radius = width * 0.135;
  return (
    <div
      style={{
        width,
        height,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
        position: "relative",
        borderRadius: radius,
        background: "#1C1B18",
        padding: 10,
        boxShadow: "0 35px 80px rgba(70, 50, 30, 0.28), 0 10px 25px rgba(0, 0, 0, 0.18)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: 18,
          width: width * 0.28,
          height: 22,
          backgroundColor: "#000000",
          borderRadius: 20,
          zIndex: 10,
        }}
      />

      {/* Screen Frame */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: width * 0.115,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#FFFFFF",
        }}
      >
        <img
          src={imageSrc}
          alt="App Screen"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};
