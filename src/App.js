import './App.css';
import React, { useEffect, useState } from "react";
import opentype from "opentype.js";

function arcLowerWarp(x, y, totalWidth, centerX, arcHeight) {
  const normX = (x - centerX) / (totalWidth / 2);
  const arcY = arcHeight * (1 - normX * normX);
  return { x, y: y + arcY };
}

function waveWarp(x, y, totalWidth, centerX, arcHeight) {
  return { x, y: y + Math.sin(x / 40) * arcHeight };
}

const warpTypes = {
  arcLower: { label: "下弧形", fn: arcLowerWarp },
  wave: { label: "波浪形", fn: waveWarp }
};

const WarpText = ({ text, warpType }) => {
  const [warpedPath, setWarpedPath] = useState("");

  useEffect(() => {
    opentype.load(process.env.PUBLIC_URL + "/OldStandardTT-Regular.ttf", (err, font) => {
      if (err || !font) {
        console.error("Font load error", err);
        return;
      }

      const fontSize = 80;
      const scale = fontSize / font.unitsPerEm;
      const arcHeight = 30; // 下弧形最大高度/波浪振幅
      const glyphs = font.stringToGlyphs(text);
      let x = 0;
      const commands = [];
      const glyphWidths = glyphs.map(g => g.advanceWidth * scale);
      const totalWidth = glyphWidths.reduce((a, b) => a + b, 0);
      const centerX = totalWidth / 2;
      const warpFn = warpTypes[warpType].fn;

      glyphs.forEach((g) => {
        const path = g.getPath(x, fontSize, fontSize);
        path.commands.forEach((cmd) => {
          const warped = { ...cmd };
          if ('x' in warped && 'y' in warped) {
            const { x: newX, y: newY } = warpFn(warped.x, warped.y, totalWidth, centerX, arcHeight);
            warped.x = newX;
            warped.y = newY;
          }
          if ('x1' in warped && 'y1' in warped) {
            const { x: newX1, y: newY1 } = warpFn(warped.x1, warped.y1, totalWidth, centerX, arcHeight);
            warped.x1 = newX1;
            warped.y1 = newY1;
          }
          if ('x2' in warped && 'y2' in warped) {
            const { x: newX2, y: newY2 } = warpFn(warped.x2, warped.y2, totalWidth, centerX, arcHeight);
            warped.x2 = newX2;
            warped.y2 = newY2;
          }
          commands.push(warped);
        });
        x += g.advanceWidth * scale;
      });

      const d = commands.map(c => {
        if (c.type === 'M') return `M ${c.x} ${c.y}`;
        if (c.type === 'L') return `L ${c.x} ${c.y}`;
        if (c.type === 'C') return `C ${c.x1} ${c.y1}, ${c.x2} ${c.y2}, ${c.x} ${c.y}`;
        if (c.type === 'Q') return `Q ${c.x1} ${c.y1}, ${c.x} ${c.y}`;
        if (c.type === 'Z') return 'Z';
        return '';
      }).join(' ');

      setWarpedPath(d);
    });
  }, [text, warpType]);

  return (
    <svg viewBox="0 0 800 300" width="100%" height="100%">
      <path d={warpedPath} fill="hotpink" />
    </svg>
  );
};

function App() {
  const [text, setText] = useState("TYPE WARP");
  const [warpType, setWarpType] = useState("arcLower");

  return (
    <div style={{ padding: 24, background: "#fff" }}>
      <h2>Adobe-style Warp Text</h2>
      <select value={warpType} onChange={e => setWarpType(e.target.value)} style={{ marginBottom: 12 }}>
        {Object.entries(warpTypes).map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ border: "1px solid #ccc", padding: 8, borderRadius: 4, marginLeft: 8 }}
        placeholder="Enter your word"
      />
      <WarpText text={text} warpType={warpType} />
    </div>
  );
}

export default App;
