/**
 * Theme utility for dynamic color generation based on config.theme_color
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb.r + (rgb.r * percent / 100),
    rgb.g + (rgb.g * percent / 100),
    rgb.b + (rgb.b * percent / 100)
  );
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function getThemeStyles(themeColor: string | undefined) {
  const color = themeColor || '#0f5d34';
  return {
    primary: color,
    primaryDark: adjustBrightness(color, -20),
    primaryLight: adjustBrightness(color, 20),
    contrastText: getContrastColor(color),
    // Inline style objects for quick use
    bg: { backgroundColor: color },
    bgHover: { backgroundColor: adjustBrightness(color, -15) },
    bgLight: { backgroundColor: adjustBrightness(color, 40) },
    text: { color: color },
    border: { borderColor: color },
  };
}
