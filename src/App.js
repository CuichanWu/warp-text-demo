// // App.js
// import "./App.css";
// import React, { useEffect, useState } from "react";
// import opentype from "opentype.js";
// import { symmetricWaveWarp } from "./SymmetricWaveWarp.js";

// // === Warp Functions ===
// const warpTypes = {
//   arcLower: { label: "下弧形", fn: arcLowerWarp },
//   wave: { label: "波浪形", fn: waveWarp },
//   bulge: { label: "上膨胀形", fn: bulgeWarp },
//   bulgeDown: { label: "下膨胀形", fn: bulgeDownWarp },
//   symmetricWave: { label: "对称波动", fn: symmetricWaveWarp },
// };

// function arcLowerWarp(x, y, totalWidth, centerX, arcHeight) {
//   const normX = (x - centerX) / (totalWidth / 2);
//   const arcY = arcHeight * (1 - normX * normX);
//   return { x, y: y + arcY };
// }

// function waveWarp(x, y, totalWidth, centerX, arcHeight) {
//   return { x, y: y + Math.sin(x / 40) * arcHeight };
// }

// function bulgeWarp(x, y, totalWidth, centerX, warpStrength) {
//   const normX = (x - centerX) / (totalWidth / 2);
//   const effectiveStrength = warpStrength / 50;
//   const scaleY = 1 + effectiveStrength * (1 - normX * normX);
//   const midY = 150;
//   return { x, y: midY + (y - midY) * scaleY };
// }

// function bulgeDownWarp(x, y, totalWidth, centerX, warpStrength) {
//   const normX = (x - centerX) / (totalWidth / 2);
//   const effectiveStrength = warpStrength / 50;
//   const scaleY = 1 + effectiveStrength * (1 - normX * normX);
//   const baseline = 100;
//   return {
//     x,
//     y: y <= baseline ? y : baseline + (y - baseline) * scaleY,
//   };
// }

// const WarpText = ({ text, warpType, warpStrength }) => {
//   const [warpedPath, setWarpedPath] = useState("");
//   const [viewBoxWidth, setViewBoxWidth] = useState(800);

//   useEffect(() => {
//     opentype.load(
//       process.env.PUBLIC_URL + "/OldStandardTT-Regular.ttf",
//       (err, font) => {
//         if (err || !font) {
//           console.error("Font load error", err);
//           return;
//         }

//         const fontSize = 80;
//         const baselineY = 150;
//         const scale = fontSize / font.unitsPerEm;
//         const arcHeight = warpStrength * 100;

//         const glyphs = font.stringToGlyphs(text);
//         let x = 0;
//         const commands = [];
//         const glyphWidths = glyphs.map((g) => g.advanceWidth * scale);
//         const totalWidth = glyphWidths.reduce((a, b) => a + b, 0);
//         const centerX = totalWidth / 2;
//         const warpFn = warpTypes[warpType].fn;

//         glyphs.forEach((g) => {
//           const path = g.getPath(x, baselineY, fontSize);
//           // const bbox = g.getBoundingBox();
//           // const textMetrics = {
//           //   boundingBox: bbox,
//           //   baseline: baselineY,
//           // };

//           const bbox = g.getBoundingBox();
//           const scaledBBox = {
//             y: baselineY + bbox.y1 * scale,
//             height: (bbox.y2 - bbox.y1) * scale,
//           };
//           const textMetrics = {
//             boundingBox: {
//               y: scaledBBox.y,
//               height: scaledBBox.height,
//             },
//             baseline: baselineY,
//           };


//           path.commands.forEach((cmd) => {
//             const warped = { ...cmd };
//             if ("x" in warped && "y" in warped) {
//               const { x: newX, y: newY } = warpFn(
//                 warped.x,
//                 warped.y,
//                 totalWidth,
//                 centerX,
//                 arcHeight,
//                 textMetrics
//               );
//               warped.x = newX;
//               warped.y = newY;
//             }
//             if ("x1" in warped && "y1" in warped) {
//               const { x: newX1, y: newY1 } = warpFn(
//                 warped.x1,
//                 warped.y1,
//                 totalWidth,
//                 centerX,
//                 arcHeight,
//                 textMetrics
//               );
//               warped.x1 = newX1;
//               warped.y1 = newY1;
//             }
//             if ("x2" in warped && "y2" in warped) {
//               const { x: newX2, y: newY2 } = warpFn(
//                 warped.x2,
//                 warped.y2,
//                 totalWidth,
//                 centerX,
//                 arcHeight,
//                 textMetrics
//               );
//               warped.x2 = newX2;
//               warped.y2 = newY2;
//             }
//             commands.push(warped);
//           });
//           x += g.advanceWidth * scale;
//         });

//         const d = commands
//           .map((c) => {
//             if (c.type === "M") return `M ${c.x} ${c.y}`;
//             if (c.type === "L") return `L ${c.x} ${c.y}`;
//             if (c.type === "C")
//               return `C ${c.x1} ${c.y1}, ${c.x2} ${c.y2}, ${c.x} ${c.y}`;
//             if (c.type === "Q") return `Q ${c.x1} ${c.y1}, ${c.x} ${c.y}`;
//             if (c.type === "Z") return "Z";
//             return "";
//           })
//           .join(" ");

//         setWarpedPath(d);
//         setViewBoxWidth(totalWidth + 40);
//       }
//     );
//   }, [text, warpType, warpStrength]);

//   return (
//     <svg viewBox={`0 0 ${viewBoxWidth} 500`} width="100%" height="100%">
//       <path d={warpedPath} fill="hotpink" stroke="hotpink" strokeWidth={4} />
//     </svg>
//   );
// };

// function App() {
//   const [text, setText] = useState("HAVE FUN");
//   const [warpType, setWarpType] = useState("symmetricWave");
//   const [warpStrength, setWarpStrength] = useState(0.45);

//   return (
//     <div style={{ padding: 24, background: "#fff" }}>
//       <h2>Adobe-style Warp Text</h2>

//       <div style={{ marginBottom: 12 }}>
//         <label style={{ marginRight: 8 }}>变形类型：</label>
//         <select value={warpType} onChange={(e) => setWarpType(e.target.value)}>
//           {Object.entries(warpTypes).map(([key, val]) => (
//             <option key={key} value={key}>
//               {val.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div style={{ marginBottom: 12 }}>
//         <label style={{ marginRight: 8 }}>强度：</label>
//         <input
//           type="range"
//           min="0"
//           max="1"
//           step="0.01"
//           value={warpStrength}
//           onChange={(e) => setWarpStrength(parseFloat(e.target.value))}
//           style={{ width: 200 }}
//         />
//         <span style={{ marginLeft: 8 }}>{Math.round(warpStrength * 100)}%</span>
//       </div>

//       <div style={{ marginBottom: 12 }}>
//         <label style={{ marginRight: 8 }}>输入文本：</label>
//         <input
//           type="text"
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           style={{ border: "1px solid #ccc", padding: 8, borderRadius: 4 }}
//           placeholder="Enter your word"
//         />
//       </div>

//       <WarpText text={text} warpType={warpType} warpStrength={warpStrength} />
//     </div>
//   );
// }

// export default App;


// import CanvasWarpText from "./CanvasWarpText";


// function App() {
//   return (
//     <div>
//       <CanvasWarpText text="HAVE FUN" intensity={0.6} font="bold 80px Inter" />
//     </div>
//   );
// }
// export default App;




// App.js
import "./App.css";
import React, { useEffect, useState } from "react";
import opentype from "opentype.js";
import { symmetricWaveWarp } from "./SymmetricWaveWarp.js";
import { samplePath, warpSampledCommands } from "./smoothWarpSampling";

const warpTypes = {
  arcLower: { label: "下弧形", fn: arcLowerWarp },
  wave: { label: "波浪形", fn: waveWarp },
  bulge: { label: "上膨胀形", fn: bulgeWarp },
  bulgeDown: { label: "下膨胀形", fn: bulgeDownWarp },
  symmetricWave: { label: "对称波动", fn: symmetricWaveWarp },
};

function arcLowerWarp(x, y, totalWidth, centerX, arcHeight) {
  const normX = (x - centerX) / (totalWidth / 2);
  const arcY = arcHeight * (1 - normX * normX);
  return { x, y: y + arcY };
}

function waveWarp(x, y, totalWidth, centerX, arcHeight) {
  return { x, y: y + Math.sin(x / 40) * arcHeight };
}

function bulgeWarp(x, y, totalWidth, centerX, warpStrength) {
  const normX = (x - centerX) / (totalWidth / 2);
  const effectiveStrength = warpStrength / 50;
  const scaleY = 1 + effectiveStrength * (1 - normX * normX);
  const midY = 150;
  return { x, y: midY + (y - midY) * scaleY };
}

function bulgeDownWarp(x, y, totalWidth, centerX, warpStrength) {
  const normX = (x - centerX) / (totalWidth / 2);
  const effectiveStrength = warpStrength / 50;
  const scaleY = 1 + effectiveStrength * (1 - normX * normX);
  const baseline = 100;
  return {
    x,
    y: y <= baseline ? y : baseline + (y - baseline) * scaleY,
  };
}

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
        const baselineY = 150;
        const scale = fontSize / font.unitsPerEm;
        const arcHeight = warpStrength * 100;

        const glyphs = font.stringToGlyphs(text);
        let x = 0;
        const commands = [];
        const glyphWidths = glyphs.map((g) => g.advanceWidth * scale);
        const totalWidth = glyphWidths.reduce((a, b) => a + b, 0);
        const centerX = totalWidth / 2;
        const warpFn = warpTypes[warpType].fn;

        glyphs.forEach((g) => {
          const bbox = g.getBoundingBox();
          const scaledBBox = {
            y: baselineY + bbox.y1 * scale,
            height: (bbox.y2 - bbox.y1) * scale,
          };
          const textMetrics = {
            boundingBox: {
              y: scaledBBox.y,
              height: scaledBBox.height,
            },
            baseline: baselineY,
          };

          const originalPath = g.getPath(x, baselineY, fontSize);
          const sampled = samplePath(originalPath, 4); // 每段插值4个点
          const warped = warpSampledCommands(
            sampled,
            warpFn,
            totalWidth,
            centerX,
            arcHeight,
            textMetrics
          );
          commands.push(...warped);

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
        setViewBoxWidth(totalWidth + 40);
      }
    );
  }, [text, warpType, warpStrength]);

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} 500`} width="100%" height="100%">
      <path d={warpedPath} fill="hotpink" stroke="hotpink" strokeWidth={4} />
    </svg>
  );
};

function App() {
  const [text, setText] = useState("HAVE FUN");
  const [warpType, setWarpType] = useState("symmetricWave");
  const [warpStrength, setWarpStrength] = useState(0.45);

  return (
    <div style={{ padding: 24, background: "#fff" }}>
      <h2>Adobe-style Warp Text</h2>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>变形类型：</label>
        <select
          value={warpType}
          onChange={(e) => setWarpType(e.target.value)}
        >
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
        <span style={{ marginLeft: 8 }}>{Math.round(warpStrength * 100)}%</span>
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
