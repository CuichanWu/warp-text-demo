import "./App.css";
import React, { useEffect, useState } from "react";
import opentype from "opentype.js";

function smoothFlowWarp(x, y, centerX, strength) {
  const dx = x - centerX;
  const normX = dx / 300; // normalize distance to center
  const normY = (y - 160) / 80; // -1 to 1

  const xOffset = -normX * strength * 100 * Math.cos(normY * Math.PI / 2);
  return { x: x + xOffset, y };
}

function App() {
  const [text, setText] = useState("HAPPY HOUR");
  const [warpStrength, setWarpStrength] = useState(0.6);
  const [d, setD] = useState("");
  const [viewBoxWidth, setViewBoxWidth] = useState(800);

  useEffect(() => {
    opentype.load(process.env.PUBLIC_URL + "/OldStandardTT-Regular.ttf", (err, font) => {
      if (err) {
        console.error(err);
        return;
      }

      const fontSize = 120;
      const scale = fontSize / font.unitsPerEm;
      const baselineY = 160;
      const glyphs = font.stringToGlyphs(text);
      const glyphWidths = glyphs.map(g => g.advanceWidth * scale);
      const totalWidth = glyphWidths.reduce((a, b) => a + b, 0);
      const centerX = totalWidth / 2;

      let x = 0;
      const all = [];
      glyphs.forEach((g, i) => {
        const path = g.getPath(x, baselineY, fontSize);

        path.commands.forEach(cmd => {
          const c = { ...cmd };

          if ("x" in c && "y" in c) {
            const warped = smoothFlowWarp(c.x, c.y, centerX, warpStrength);
            c.x = warped.x;
            c.y = warped.y;
          }
          if ("x1" in c && "y1" in c) {
            const warped = smoothFlowWarp(c.x1, c.y1, centerX, warpStrength);
            c.x1 = warped.x;
            c.y1 = warped.y;
          }
          if ("x2" in c && "y2" in c) {
            const warped = smoothFlowWarp(c.x2, c.y2, centerX, warpStrength);
            c.x2 = warped.x;
            c.y2 = warped.y;
          }

          all.push(c);
        });

        x += glyphWidths[i];
      });

      const pathData = all.map(c => {
        if (c.type === "M") return `M ${c.x} ${c.y}`;
        if (c.type === "L") return `L ${c.x} ${c.y}`;
        if (c.type === "C") return `C ${c.x1} ${c.y1}, ${c.x2} ${c.y2}, ${c.x} ${c.y}`;
        if (c.type === "Q") return `Q ${c.x1} ${c.y1}, ${c.x} ${c.y}`;
        if (c.type === "Z") return "Z";
        return "";
      }).join(" ");

      setD(pathData);
      setViewBoxWidth(totalWidth + 40);
    });
  }, [text, warpStrength]);

  return (
    <div style={{ padding: 24, background: "#222", color: "white" }}>
      <h2>花束型</h2>
      <div>
        <label>文本：</label>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ padding: 8, width: 300 }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>强度：</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={warpStrength}
          onChange={e => setWarpStrength(parseFloat(e.target.value))}
        />
        <span style={{ marginLeft: 12 }}>{Math.round(warpStrength * 100)}%</span>
      </div>

      <svg viewBox={`0 0 ${viewBoxWidth} 300`} width="100%" height="300px">
        <path d={d} fill="hotpink" />
      </svg>
    </div>
  );
}

export default App;
