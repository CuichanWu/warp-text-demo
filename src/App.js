import "./App.css";
import React, { useEffect, useState } from "react";
import opentype from "opentype.js";

// === Warp Functions ===

function arcLowerWarp(x, y, totalWidth, centerX, arcHeight) {
  const normX = (x - centerX) / (totalWidth / 2);
  const arcY = arcHeight * (1 - normX * normX);
  return { x, y: y + arcY };
}

function waveWarp(x, y, totalWidth, centerX, arcHeight) {
  return { x, y: y + Math.sin(x / 40) * arcHeight };
}

function bulgeWarp(x, y, totalWidth, centerX, warpStrength) {
  const normX = (x - centerX) / (totalWidth / 2); // -1 to 1
  const scaleY = 1 + warpStrength * (1 - normX * normX); // bell curve
  const midY = 80; // font baseline center
  return { x, y: midY + (y - midY) * scaleY };
}

function bulgeDownWarp(x, y, totalWidth, centerX, arcHeight) {
  const normX = (x - centerX) / (totalWidth / 2); // -1 ~ 1
  const offset = arcHeight * (1 - normX * normX); // bell shape
  const baseline = 80;

  const distance = y - baseline; // 下为正，上为负
  const stretch = distance > 0 ? distance + offset : distance;

  return {
    x,
    y: baseline + stretch,
  };
}

const warpTypes = {
  arcLower: { label: "下弧形", fn: arcLowerWarp },
  wave: { label: "波浪形", fn: waveWarp },
  bulge: { label: "上膨胀形", fn: bulgeWarp },
  bulgeDown: { label: "下膨胀形", fn: bulgeDownWarp },
};

// === WarpText Component ===

const WarpText = ({ text, warpType, warpStrength }) => {
  const [warpedPath, setWarpedPath] = useState("");
  const [viewBoxWidth, setViewBoxWidth] = useState(800);

  useEffect(() => {
    opentype.load(
      process.env.PUBLIC_URL + "/OldStandardTT-Regular.ttf",
      (err, font) => {
        if (err || !font) {
          console.error("Font load error", err);
          return;
        }

        const fontSize = 80;
        const scale = fontSize / font.unitsPerEm;

        // ✅ 区分不同 warp 类型的强度单位
        const arcHeight = warpType.includes("bulge")
          ? warpStrength // bulge: 0 ~ 1
          : warpStrength * 100; // arc/wave: 像素值

        const glyphs = font.stringToGlyphs(text);
        let x = 0;
        const commands = [];
        const glyphWidths = glyphs.map((g) => g.advanceWidth * scale);
        const totalWidth = glyphWidths.reduce((a, b) => a + b, 0);
        const centerX = totalWidth / 2;
        const warpFn = warpTypes[warpType].fn;

        glyphs.forEach((g) => {
          const path = g.getPath(x, fontSize, fontSize);
          path.commands.forEach((cmd) => {
            const warped = { ...cmd };
            if ("x" in warped && "y" in warped) {
              const { x: newX, y: newY } = warpFn(
                warped.x,
                warped.y,
                totalWidth,
                centerX,
                arcHeight
              );
              warped.x = newX;
              warped.y = newY;
            }
            if ("x1" in warped && "y1" in warped) {
              const { x: newX1, y: newY1 } = warpFn(
                warped.x1,
                warped.y1,
                totalWidth,
                centerX,
                arcHeight
              );
              warped.x1 = newX1;
              warped.y1 = newY1;
            }
            if ("x2" in warped && "y2" in warped) {
              const { x: newX2, y: newY2 } = warpFn(
                warped.x2,
                warped.y2,
                totalWidth,
                centerX,
                arcHeight
              );
              warped.x2 = newX2;
              warped.y2 = newY2;
            }
            commands.push(warped);
          });
          x += g.advanceWidth * scale;
        });

        const d = commands
          .map((c) => {
            if (c.type === "M") return `M ${c.x} ${c.y}`;
            if (c.type === "L") return `L ${c.x} ${c.y}`;
            if (c.type === "C")
              return `C ${c.x1} ${c.y1}, ${c.x2} ${c.y2}, ${c.x} ${c.y}`;
            if (c.type === "Q") return `Q ${c.x1} ${c.y1}, ${c.x} ${c.y}`;
            if (c.type === "Z") return "Z";
            return "";
          })
          .join(" ");

        setWarpedPath(d);
        setViewBoxWidth(totalWidth + 40); // 动态宽度
      }
    );
  }, [text, warpType, warpStrength]);

  return (
    <svg viewBox={`0 -100 ${viewBoxWidth} 1000`} width="100%" height="100%">
      <line
        x1="0"
        y1="80"
        x2={viewBoxWidth}
        y2="80"
        stroke="gray"
        strokeDasharray="4"
      />

      <path d={warpedPath} fill="hotpink" />
    </svg>
  );
};

// === App Component ===

function App() {
  const [text, setText] = useState("HAVE FUN");
  const [warpType, setWarpType] = useState("bulge");
  const [warpStrength, setWarpStrength] = useState(0.45); // default 45% for bulge

  return (
    <div style={{ padding: 24, background: "#fff" }}>
      <h2>Adobe-style Warp Text</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>变形类型：</label>
        <select value={warpType} onChange={(e) => setWarpType(e.target.value)}>
          {Object.entries(warpTypes).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>强度：</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={warpStrength}
          onChange={(e) => setWarpStrength(parseFloat(e.target.value))}
          style={{ width: 200 }}
        />
        <span style={{ marginLeft: 8 }}>
          {warpType === "bulge"
            ? `${Math.round(warpStrength * 100)}%`
            : `${Math.round(warpStrength * 100)}px`}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>输入文本：</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ border: "1px solid #ccc", padding: 8, borderRadius: 4 }}
          placeholder="Enter your word"
        />
      </div>

      <WarpText text={text} warpType={warpType} warpStrength={warpStrength} />
    </div>
  );
}

export default App;
