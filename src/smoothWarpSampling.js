// smoothWarpSampling.js
import opentype from "opentype.js";

export function samplePath(path, density = 4) {
  const sampled = [];
  let currentX = 0;
  let currentY = 0;

  for (const cmd of path.commands) {
    if (cmd.type === "M" || cmd.type === "L") {
      sampled.push({ ...cmd });
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === "C") {
      for (let i = 0; i <= density; i++) {
        const t = i / density;
        const x = cubicAt(currentX, cmd.x1, cmd.x2, cmd.x, t);
        const y = cubicAt(currentY, cmd.y1, cmd.y2, cmd.y, t);
        sampled.push({ type: "L", x, y });
      }
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === "Q") {
      for (let i = 0; i <= density; i++) {
        const t = i / density;
        const x = quadAt(currentX, cmd.x1, cmd.x, t);
        const y = quadAt(currentY, cmd.y1, cmd.y, t);
        sampled.push({ type: "L", x, y });
      }
      currentX = cmd.x;
      currentY = cmd.y;
    } else if (cmd.type === "Z") {
      sampled.push({ type: "Z" });
    }
  }

  return sampled;
}

function cubicAt(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

function quadAt(p0, p1, p2, t) {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

export function warpSampledCommands(commands, warpFn, totalWidth, centerX, intensity, textMetrics) {
  return commands.map((cmd) => {
    if ("x" in cmd && "y" in cmd) {
      const warped = warpFn(cmd.x, cmd.y, totalWidth, centerX, intensity, textMetrics);
      return { ...cmd, x: warped.x, y: warped.y };
    }
    return cmd;
  });
}
