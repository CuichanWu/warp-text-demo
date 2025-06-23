// symmetricWaveWarp.js
export function symmetricWaveWarp(x, y, totalWidth, centerX, intensity, textMetrics) {
  const waveLength = 120;
  const amplitude = intensity / 6;

  const top = textMetrics.boundingBox.y;
  const bottom = textMetrics.boundingBox.y + textMetrics.boundingBox.height;
  const normY = (y - top) / (bottom - top); // from 0 (top) to 1 (bottom)

  // 波动强度分布：中间最大，两端为 0（sin(π * normY)）
  const envelope = Math.sin(Math.PI * normY);

  const wave = Math.sin(x / waveLength) * amplitude;

  return {
    x,
    y: y + wave * envelope,
  };
}
