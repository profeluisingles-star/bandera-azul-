import { buildQrMatrix } from './qrEngine.js';

export interface QrSvgData {
  size: number;
  viewBox: string;
  pathD: string;
}

export function generateQrData(value: string): QrSvgData {
  return buildQrMatrix(value);
}

export function buildQrSvgString(value: string, fgColor = '#14532D'): string {
  const { size, viewBox, pathD } = buildQrMatrix(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size * 8}" height="${size * 8}" role="img" aria-label="Código QR ECOTRON"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${pathD}" fill="${fgColor}"/></svg>`;
}
