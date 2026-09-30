// Usage: node slice-icons.mjs docs/nav-icons/sheet.svg <out-dir>   (needs the sharp package)
// Finds icon rows/columns from ink projections (no fixed grid), takes the first 3 rows x 4 columns in reading
// order, and writes white-on-transparent 192 px masks nav-<name>.png plus contact.png. Copy the ones in use to
// media/icons/<name>.png (anchor and mail are spares).
import sharp from "sharp";
const [SHEET, OUTDIR] = process.argv.slice(2);
const NAMES = ["camera", "play", "crew", "growth", "live", "mic", "grid", "send", "sailboat", "key", "anchor", "mail"];
const W = 2432, H = 1792;
const full = await sharp(SHEET, { density: 72 }).resize(W, H).flatten({ background: "#fff" }).greyscale().png().toBuffer();
const { data, info } = await sharp(full).raw().toBuffer({ resolveWithObject: true });
const C = info.channels, dark = (x, y) => data[(y * W + x) * C] < 200;
function bands(count, isInk, minGap) {                 // runs of ink separated by >= minGap empty lines
  const out = []; let start = -1, gap = 0;
  for (let i = 0; i < count; i++) {
    if (isInk(i)) { if (start < 0) start = i; gap = 0; }
    else if (start >= 0 && ++gap >= minGap) { out.push([start, i - gap]); start = -1; gap = 0; }
  }
  if (start >= 0) out.push([start, count - 1]);
  return out.filter(([a, b]) => b - a > 20);
}
const rowInk = (y) => { for (let x = 0; x < W; x++) if (dark(x, y)) return true; return false; };
const rows = bands(H, rowInk, 40).slice(0, 3);
const cells = [];
for (const [y0, y1] of rows) {
  const colInk = (x) => { for (let y = y0; y <= y1; y++) if (dark(x, y)) return true; return false; };
  for (const [x0, x1] of bands(W, colInk, 40).slice(0, 4)) {
    let a = H, b = 0;                                   // tighten vertically inside the column
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (dark(x, y)) { a = Math.min(a, y); b = Math.max(b, y); }
    cells.push([x0, a, x1, b]);
  }
}
console.log("rows", rows.length, "cells", cells.length);
const OUT = 192, LIVE = 150;
for (let i = 0; i < Math.min(12, cells.length); i++) {
  const [x0, y0, x1, y1] = cells[i], w = x1 - x0 + 1, h = y1 - y0 + 1, k = LIVE / Math.max(w, h);
  const ink = await sharp(full).extract({ left: x0, top: y0, width: w, height: h }).negate()
    .resize(Math.round(w * k), Math.round(h * k), { kernel: "lanczos3" }).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  const iw = ink.info.width, ih = ink.info.height, px = Buffer.alloc(OUT * OUT * 4);
  const ox = Math.round((OUT - iw) / 2), oy = Math.round((OUT - ih) / 2);
  for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) { const j = ((y + oy) * OUT + (x + ox)) * 4; px[j] = px[j + 1] = px[j + 2] = 255; px[j + 3] = ink.data[(y * iw + x) * ink.info.channels]; }
  await sharp(px, { raw: { width: OUT, height: OUT, channels: 4 } }).png({ compressionLevel: 9 }).toFile(`${OUTDIR}/nav-${NAMES[i]}.png`);
}
const comps = [];
for (let i = 0; i < Math.min(12, cells.length); i++) {
  const f = `${OUTDIR}/nav-${NAMES[i]}.png`;
  comps.push({ input: await sharp(f).resize(64).toBuffer(), left: 16 + i * 92, top: 16 });
  comps.push({ input: await sharp(f).resize(27).toBuffer(), left: 34 + i * 92, top: 96 });
}
await sharp({ create: { width: 16 + 12 * 92, height: 140, channels: 3, background: "#031e25" } }).composite(comps).png().toFile(`${OUTDIR}/contact.png`);
