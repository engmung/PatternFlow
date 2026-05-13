/**
 * LED Correction Pipeline
 * Transforms source frames into 128×64 LED-friendly images.
 * License: MIT
 */

import { PFV_WIDTH, PFV_HEIGHT } from "./pfv";

export type FitMode = "cover" | "contain";
export type DitherMode = "off" | "floyd-steinberg" | "ordered";
export type Rotation = 0 | 90 | 180 | 270;

export interface PipelineOptions {
  fitMode: FitMode;
  cropX: number;
  cropY: number;
  rotation: Rotation;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  dither: DitherMode;
}

export const DEFAULT_PIPELINE: PipelineOptions = {
  fitMode: "cover",
  cropX: 0.5,
  cropY: 0.5,
  rotation: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  gamma: 1.0,
  dither: "off",
};

let _resizeCanvas: OffscreenCanvas | null = null;
let _resizeCtx: OffscreenCanvasRenderingContext2D | null = null;

function getResizeCtx() {
  if (!_resizeCanvas) {
    _resizeCanvas = new OffscreenCanvas(PFV_WIDTH, PFV_HEIGHT);
    _resizeCtx = _resizeCanvas.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
  }
  return _resizeCtx!;
}

export function processFrame(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  opts: PipelineOptions = DEFAULT_PIPELINE,
): ImageData {
  const ctx = getResizeCtx();
  drawResized(ctx, source, srcW, srcH, opts);
  const imageData = ctx.getImageData(0, 0, PFV_WIDTH, PFV_HEIGHT);
  applyCorrections(imageData, opts);
  if (opts.dither !== "off") applyDither(imageData, opts.dither);
  return imageData;
}

// Scratch canvas for rotation pre-pass
let _rotCanvas: OffscreenCanvas | null = null;
let _rotCtx: OffscreenCanvasRenderingContext2D | null = null;

function getRotatedSource(
  source: CanvasImageSource,
  srcW: number, srcH: number,
  rotation: Rotation,
): { img: CanvasImageSource; w: number; h: number } {
  if (rotation === 0) return { img: source, w: srcW, h: srcH };

  const swap = rotation === 90 || rotation === 270;
  const outW = swap ? srcH : srcW;
  const outH = swap ? srcW : srcH;

  if (!_rotCanvas || _rotCanvas.width !== outW || _rotCanvas.height !== outH) {
    _rotCanvas = new OffscreenCanvas(outW, outH);
    _rotCtx = _rotCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  }
  const rc = _rotCtx!;
  rc.clearRect(0, 0, outW, outH);
  rc.save();
  rc.translate(outW / 2, outH / 2);
  rc.rotate((rotation * Math.PI) / 180);
  rc.drawImage(source, -srcW / 2, -srcH / 2);
  rc.restore();

  return { img: _rotCanvas, w: outW, h: outH };
}

function drawResized(
  ctx: OffscreenCanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number, srcH: number,
  opts: PipelineOptions,
) {
  // Apply rotation first
  const { img, w: rW, h: rH } = getRotatedSource(source, srcW, srcH, opts.rotation);

  const dW = PFV_WIDTH, dH = PFV_HEIGHT;
  const srcA = rW / rH, dstA = dW / dH;
  ctx.clearRect(0, 0, dW, dH);

  if (opts.fitMode === "contain") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, dW, dH);
    let drawW: number, drawH: number;
    if (srcA > dstA) { drawW = dW; drawH = dW / srcA; }
    else { drawH = dH; drawW = dH * srcA; }
    ctx.drawImage(img, (dW - drawW) / 2, (dH - drawH) / 2, drawW, drawH);
  } else {
    let sx: number, sy: number, sw: number, sh: number;
    if (srcA > dstA) {
      sh = rH; sw = rH * dstA;
      sx = (rW - sw) * opts.cropX; sy = 0;
    } else {
      sw = rW; sh = rW / dstA;
      sx = 0; sy = (rH - sh) * opts.cropY;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dW, dH);
  }
}

function applyCorrections(imageData: ImageData, opts: PipelineOptions) {
  const d = imageData.data;
  const bf = opts.brightness / 100;         // 0→0, 100→1, 200→2
  const cm = opts.contrast / 100;            // 0→0 (gray), 100→1 (neutral), 200→2
  const sf = opts.saturation / 100;          // 0→0 (mono), 100→1 (neutral), 200→2
  const gi = opts.gamma !== 0 ? 1 / opts.gamma : 1;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] / 255, g = d[i+1] / 255, b = d[i+2] / 255;

    // Brightness
    r *= bf; g *= bf; b *= bf;

    // Contrast (around 0.5 midpoint)
    r = (r - 0.5) * cm + 0.5;
    g = (g - 0.5) * cm + 0.5;
    b = (b - 0.5) * cm + 0.5;

    // Saturation (luminosity-preserving)
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = lum + (r - lum) * sf;
    g = lum + (g - lum) * sf;
    b = lum + (b - lum) * sf;

    // Gamma
    r = Math.pow(Math.max(0, r), gi);
    g = Math.pow(Math.max(0, g), gi);
    b = Math.pow(Math.max(0, b), gi);

    d[i]   = Math.max(0, Math.min(255, Math.round(r * 255)));
    d[i+1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    d[i+2] = Math.max(0, Math.min(255, Math.round(b * 255)));
  }
}

const BAYER4 = [0/16,8/16,2/16,10/16, 12/16,4/16,14/16,6/16, 3/16,11/16,1/16,9/16, 15/16,7/16,13/16,5/16];

function applyDither(imageData: ImageData, mode: DitherMode) {
  if (mode === "ordered") applyOrderedDither(imageData);
  else applyFloydSteinberg(imageData);
}

function applyFloydSteinberg(img: ImageData) {
  const w = img.width, h = img.height, d = img.data;
  const rf = new Float32Array(w*h), gf = new Float32Array(w*h), bf = new Float32Array(w*h);
  for (let i = 0; i < w*h; i++) { rf[i] = d[i*4]; gf[i] = d[i*4+1]; bf[i] = d[i*4+2]; }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y*w+x;
      const oR = rf[idx], oG = gf[idx], oB = bf[idx];
      const nR = Math.round(oR/255*31)*(255/31);
      const nG = Math.round(oG/255*63)*(255/63);
      const nB = Math.round(oB/255*31)*(255/31);
      rf[idx] = nR; gf[idx] = nG; bf[idx] = nB;
      const eR = oR-nR, eG = oG-nG, eB = oB-nB;
      const sp = (di: number, w: number) => { rf[di]+=eR*w; gf[di]+=eG*w; bf[di]+=eB*w; };
      if (x+1<w) sp(idx+1, 7/16);
      if (y+1<h) {
        if (x-1>=0) sp(idx+w-1, 3/16);
        sp(idx+w, 5/16);
        if (x+1<w) sp(idx+w+1, 1/16);
      }
    }
  }
  for (let i = 0; i < w*h; i++) {
    d[i*4] = Math.max(0,Math.min(255,Math.round(rf[i])));
    d[i*4+1] = Math.max(0,Math.min(255,Math.round(gf[i])));
    d[i*4+2] = Math.max(0,Math.min(255,Math.round(bf[i])));
  }
}

function applyOrderedDither(img: ImageData) {
  const w = img.width, h = img.height, d = img.data;
  const rS = 255/31, gS = 255/63, bS = 255/31;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y*w+x)*4;
      const t = BAYER4[(y%4)*4+(x%4)] - 0.5;
      d[i] = Math.max(0,Math.min(255,Math.round(Math.round((d[i]+t*rS)/rS)*rS)));
      d[i+1] = Math.max(0,Math.min(255,Math.round(Math.round((d[i+1]+t*gS)/gS)*gS)));
      d[i+2] = Math.max(0,Math.min(255,Math.round(Math.round((d[i+2]+t*bS)/bS)*bS)));
    }
  }
}
