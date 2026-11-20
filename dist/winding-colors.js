// A fixed, continuous display scale for W = 0…6. Values outside the scale
// keep the nearest endpoint colour; numeric values are never clamped here.
const stops = [
  [250, 204, 21],  // Gold
  [251, 146, 60],  // Orange
  [244, 114, 182], // Pink
  [167, 139, 250], // Violet
  [96, 165, 250],  // Blue
  [34, 211, 238],  // Cyan
  [52, 211, 153]   // Mint
];

export function windingColor(value, alpha = 1, brightness = 1) {
  if (!Number.isFinite(value)) return `rgba(160,173,159,${alpha})`;
  const position = Math.max(0, Math.min(stops.length - 1, value));
  const lower = Math.floor(position), upper = Math.min(stops.length - 1, lower + 1);
  const fraction = position - lower;
  const rgb = stops[lower].map((channel, index) => Math.max(0, Math.min(255,
    Math.round((channel * (1 - fraction) + stops[upper][index] * fraction) * brightness)
  )));
  return `rgba(${rgb.join(',')},${alpha})`;
}

export const windingGradient = `linear-gradient(90deg,${stops.map(rgb => `rgb(${rgb.join(',')})`).join(',')})`;
