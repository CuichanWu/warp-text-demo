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

// ✅ 重点：上凹形变形，baseline 不动，上方中间凹陷
function concaveTopWarp(x, y, totalWidth, centerX, arcHeight, textMetrics) {
  const baseline = textMetrics.baseline;
  const top = textMetrics.boundingBox.y;

  if (y >= baseline) return { x, y }; // baseline 以下不变

  const normX = (x - centerX) / (totalWidth / 2); // -1 to 1
  const horizontalFactor = 1 - normX * normX; // 抛物线：中间最大

  const normY = (baseline - y) / (baseline - top); // y 越靠近 top，值越大
  const verticalFactor = normY;

  const offsetY = arcHeight * horizontalFactor * verticalFactor;

  return {
    x,
    y: y + offsetY, // 向下压（所以是 +offsetY）
  };
}

function concaveBottomWarp(x, y, totalWidth, centerX, warpStrength, textMetrics) {
  const normX = (x - centerX) / (totalWidth / 2); // -1 ~ 1
  const strength = warpStrength / 50;

  // 从中间向两边 scaleY 从 min 到 1（反向 bulge）
  const scaleY = 1 - strength * (1 - normX * normX);

  const baseline = 90;

  if (y <= baseline) {
    return { x, y }; // baseline 以上不变
  } else {
    return {
      x,
      y: baseline + (y - baseline) * scaleY, // baseline 以下按 scaleY 缩放
    };
  }
}

function slantDownRightWarp(x, y, totalWidth, centerX, warpStrength, textMetrics) {
  const baseline = 100;
  if (y <= baseline) return { x, y };

  const leftX = centerX - totalWidth / 2;
  const ratio = (x - leftX) / totalWidth / 100; // 0 (左) 到 1 (右)

  const minScale = 0.1;
  const targetScale = 1 - 0.9 * warpStrength; // 最小 scaleY = 0.1

  const scaleY = Math.max(
    minScale,
    1 - (1 - targetScale) * ratio // 从 1 平滑过渡到 targetScale
  );

  return {
    x,
    y: baseline + (y - baseline) * scaleY,
  };
}


function slantDownLeftWarp(x, y, totalWidth, centerX, warpStrength, textMetrics) {
  const baseline = 100;
  if (y <= baseline) return { x, y };

  const leftX = centerX - totalWidth / 2;
  const ratio = (1 - (x - leftX) / totalWidth) / 100; // 右侧为 0，左侧为 1（缓慢）

  const minScale = 0.1;
  const targetScale = 1 - 0.9 * warpStrength;

  const scaleY = Math.max(
    minScale,
    1 - (1 - targetScale) * ratio
  );

  return {
    x,
    y: baseline + (y - baseline) * scaleY,
  };
}

function inflateSidesWarp(x, y, totalWidth, centerX, intensity, textMetrics) {
  const baseline = textMetrics.boundingBox.y + textMetrics.boundingBox.height / 2;
  const normX = (x - centerX) / (totalWidth / 2); // -1 ~ 1

  // y方向变形强度：中间为1，两边为 1 + intensity（使用余弦平滑过渡）
  const verticalScale = 1 + intensity * (1 - Math.cos(normX * Math.PI)) / 2;

  // x方向轻微变宽，随位置扩张
  const horizontalScale = 1 + (intensity / 3) * (1 - Math.cos(normX * Math.PI)) / 2;

  return {
    x: centerX + (x - centerX) * horizontalScale,
    y: baseline + (y - baseline) * verticalScale,
  };
}

function capsuleEnvelopeWarp(x, y, totalWidth, centerX, intensity, textMetrics) {
  const normX = (x - centerX) / (totalWidth / 2); // -1 到 1
  const curveFactor = Math.pow(Math.abs(normX), 2); // 中间 = 0，两边接近 1（缓变）

  const baseScale = 1; // 中间字符的 scale
  const extraScale = intensity; // 两侧额外增加的 scaleY

  const scaleY = baseScale + extraScale * curveFactor;

  const baselineY = textMetrics.boundingBox.y + textMetrics.boundingBox.height / 2;

  return {
    x,
    y: baselineY + (y - baselineY) * scaleY,
  };
}


function archBendWarp(x, y, totalWidth, centerX, intensity, textMetrics) {
  // normX: -1 到 1，表示字符横向位置
  const normX = (x - centerX) / (totalWidth / 2);

  // 控制弯曲弧线（cos 函数模拟圆弧底部）
  const curve = Math.cos(normX * Math.PI); // 中间为1，两端为-1

  // 中心为0偏移，两边偏移最大（反向圆弧）
  const offsetY = -intensity * textMetrics.boundingBox.height * (1 - curve) / 2;

  return {
    x,
    y: y + offsetY // 只偏移 y，不拉伸
  };
}

function centerAttractBendWarp(x, y, totalWidth, centerX, intensity, textMetrics) {
  const centerY = textMetrics.boundingBox.y + textMetrics.boundingBox.height / 2;
  const cx = centerX;
  const cy = centerY;

  // 计算控制点距离中心的向量
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const maxDistance = Math.sqrt((totalWidth / 2) ** 2 + (textMetrics.boundingBox.height / 2) ** 2);
  const normDist = distance / maxDistance; // 0（中心）到 1（边缘）

  // 弯曲幅度（边缘最大，中心为0）
  const pull = intensity * normDist * normDist; // 二次缓变：中心稳定，两边轻吸

  // 向中心轻微偏移（但保留原结构）
  return {
    x: x - dx * pull * 0.05,
    y: y - dy * pull * 0.1
  };
}




const warpTypes = {
  arcLower: { label: "下弧形", fn: arcLowerWarp },
  wave: { label: "波浪形", fn: waveWarp },
  bulge: { label: "上膨胀形", fn: bulgeWarp },
  bulgeDown: { label: "下膨胀形", fn: bulgeDownWarp },
  concaveUp: { label: "上凹形（底部对齐）", fn: concaveTopWarp },
  concaveDown: { label: "下凹形（顶部对齐）", fn: concaveBottomWarp },
  slantDownRight: { label: "下斜形（右低）", fn: slantDownRightWarp },
  slantDownLeft: { label: "下斜形（左低）", fn: slantDownLeftWarp },
  inflateSides: { label: "两边鼓起（上下对称）", fn: inflateSidesWarp },
  capsuleEnvelope: { label: "胶囊鼓形（中平两鼓）", fn: capsuleEnvelopeWarp },
  archBend: { label: "弧形包裹（字符不变形）", fn: archBendWarp },
  centerAttract: { label: "中心吸引弯曲（贴图式）", fn: centerAttractBendWarp },
};

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

        const textMetrics = {
          boundingBox: {
            y: baselineY - fontSize,
            height: fontSize,
          },
          baseline: baselineY,
        };

        glyphs.forEach((g) => {
          const path = g.getPath(x, baselineY, fontSize);
          path.commands.forEach((cmd) => {
            const warped = { ...cmd };
            if ("x" in warped && "y" in warped) {
              const { x: newX, y: newY } = warpFn(
                warped.x,
                warped.y,
                totalWidth,
                centerX,
                arcHeight,
                textMetrics
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
                arcHeight,
                textMetrics
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
                arcHeight,
                textMetrics
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
        setViewBoxWidth(totalWidth + 40);
      }
    );
  }, [text, warpType, warpStrength]);

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} 500`} width="100%" height="100%">
      <path d={warpedPath} fill="hotpink" />
    </svg>
  );
};

function App() {
  const [text, setText] = useState("HAVE FUN");
  const [warpType, setWarpType] = useState("bulgeDown");
  const [warpStrength, setWarpStrength] = useState(0.45);

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
          {Math.round(warpStrength * 100)}%
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

      <WarpText
        text={text}
        warpType={warpType}
        warpStrength={warpStrength}
      />
    </div>
  );
}

export default App;
