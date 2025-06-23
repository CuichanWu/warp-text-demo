// CanvasWarpText.js
import React, { useEffect, useRef } from "react";

function warpFunction(x, y, width, height, intensity) {
  const waveLength = 120;
  const amplitude = intensity * 20;

  const normY = y / height; // 0 (top) to 1 (bottom)
  const envelope = Math.sin(Math.PI * normY); // 中间最大，两端为 0
  const wave = Math.sin(x / waveLength) * amplitude;

  return {
    x,
    y: y + wave * envelope,
  };
}

const CanvasWarpText = ({ text, font = "80px serif", intensity = 0.5 }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width = 1000;
    const height = canvas.height = 300;

    // Render original text to temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = "black";
    tempCtx.font = font;
    tempCtx.textBaseline = "middle";
    tempCtx.textAlign = "center";
    tempCtx.fillText(text, width / 2, height / 2);

    // Read original image data
    const src = tempCtx.getImageData(0, 0, width, height);
    const dest = ctx.createImageData(width, height);

    // Warp each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const { x: srcXf, y: srcYf } = warpFunction(x, y, width, height, intensity);
        const srcX = Math.round(srcXf);
        const srcY = Math.round(srcYf);

        const dstIndex = (y * width + x) * 4;
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          const srcIndex = (srcY * width + srcX) * 4;
          dest.data[dstIndex] = src.data[srcIndex];
          dest.data[dstIndex + 1] = src.data[srcIndex + 1];
          dest.data[dstIndex + 2] = src.data[srcIndex + 2];
          dest.data[dstIndex + 3] = src.data[srcIndex + 3];
        }
      }
    }

    ctx.putImageData(dest, 0, 0);
  }, [text, font, intensity]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "auto" }} />;
};

export default CanvasWarpText;
