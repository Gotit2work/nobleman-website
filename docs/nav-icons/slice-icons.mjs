// Usage: node slice-icons.mjs docs/nav-icons/sheet.svg <out-dir>   (needs the sharp package)
// Cuts the 4x3 icon sheet into white-on-transparent 192 px masks named nav-<name>.png, plus contact.png.
import sharp from "sharp";
const SHEET = process.argv[2], OUTDIR = process.argv[3] || ".";
const NAMES = [["camera","play","crew","growth"],["live","mic","grid","send"],["sailboat","key","home","mail"]];
const W = 2432, H = 1792, CW = W / 4, CH = H / 4;             // 4 x 4 cells (4th row is an unused bonus row)
const full = await sharp(SHEET, { density: 72 }).resize(W, H).flatten({ background: "#fff" }).greyscale().png().toBuffer();
const { data, info: finfo } = await sharp(full).raw().toBuffer({ resolveWithObject: true });
const C = finfo.channels;
const OUT = 192, LIVE = 150;                                    // canvas and the max ink size inside it
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = Math.floor(r * CH); y < (r + 1) * CH; y++) for (let x = Math.floor(c * CW); x < (c + 1) * CW; x++)
    if (data[(y * W + x) * C] < 200) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = LIVE / Math.max(w, h);
  // Alpha = darkness (black ink opaque, white holes transparent); colour = white.
  const ink = await sharp(full).extract({ left: x0, top: y0, width: w, height: h })
    .negate().resize(Math.round(w * k), Math.round(h * k), { kernel: "lanczos3" }).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  const iw = ink.info.width, ih = ink.info.height, px = Buffer.alloc(OUT * OUT * 4);
  const ox = Math.round((OUT - iw) / 2), oy = Math.round((OUT - ih) / 2);
  for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) { const i = ((y + oy) * OUT + (x + ox)) * 4; px[i] = px[i + 1] = px[i + 2] = 255; px[i + 3] = ink.data[(y * iw + x) * ink.info.channels]; }
  const name = NAMES[r][c];
  await sharp(px, { raw: { width: OUT, height: OUT, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(`${OUTDIR}/nav-${name}.png`);
  console.log(name, `ink ${w}x${h} -> ${iw}x${ih}`);
}
// Contact sheet: each icon at 28px and 56px on the dark brand colour, and at 28px on white (as a mask would render dark).
const names = NAMES.flat(), comps = [];
for (let i = 0; i < names.length; i++) {
  const f = `${OUTDIR}/nav-${names[i]}.png`;
  comps.push({ input: await sharp(f).resize(56).toBuffer(), left: 20 + i * 96, top: 20 });
  comps.push({ input: await sharp(f).resize(28).toBuffer(), left: 34 + i * 96, top: 100 });
}
await sharp({ create: { width: 20 + names.length * 96, height: 150, channels: 3, background: "#031e25" } }).composite(comps).png().toFile(`${OUTDIR}/contact.png`);
