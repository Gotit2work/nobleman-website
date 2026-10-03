// Prints welcome.html to Nobleman-Welcome.pdf: the six-page client welcome (US Letter), built to open fast and look
// sharp in Acrobat. Not part of the website (.vercelignore keeps docs/ out).
//
//   cd docs/welcome && npm install            once
//   node build.mjs                            → Nobleman-Welcome.pdf
//   node build.mjs --for "Harbor Labs"        → Nobleman-Welcome-Harbor-Labs.pdf, with "Prepared for Harbor Labs" on the cover
//
// Chromium: CHROMIUM_PATH, the cloud containers' copy, or `npx playwright install chromium`. qpdf (optional) saves a
// fast-opening copy, kept only when qpdf checks it clean.
//
// It refuses to write the PDF when an image is missing, a page's content runs off it, a font other than the brand's
// three ends up in the file (a character the fonts lack), a font would be drawn as shapes ("Type3", which Chrome does
// with variable fonts), or something needs a transparency mask. The two photos with a gradient over them are
// flattened into plain images first. The QR code is made from the Start a project link on the last page, so the
// domain move (scripts/move-domain.mjs) updates it too: rebuild after the move.
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import QRCode from "qrcode";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const forName = args.includes("--for") ? String(args[args.indexOf("--for") + 1] || "").trim() : "";
const slug = forName.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
const out = path.join(here, slug ? `Nobleman-Welcome-${slug}.pdf` : "Nobleman-Welcome.pdf");
const BRAND_FONTS = /^(Inter|CormorantGaramond|IBMPlexMono)/;
const fail = (lines) => { for (const s of lines) console.error(s); process.exitCode = 1; };
const exe = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

const browser = await chromium.launch({ executablePath: exe });
try {
  // 96 px per inch × 2.5 = 240 dpi for the flattened photos.
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2.5 });
  await page.goto(pathToFileURL(path.join(here, "welcome.html")).href, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });

  // The QR code (vector, brand teal on paper) and the optional client name.
  const link = await page.$eval("[data-qr]", (a) => a.dataset.qr);
  const svg = await QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#031e25", light: "#f4f4f2" } });
  await page.evaluate(({ svg, forName }) => {
    document.querySelector(".cta .qr").innerHTML = svg;
    if (forName) { document.querySelector("[data-for-name]").textContent = forName; document.querySelector("[data-for]").hidden = false; }
  }, { svg, forName });
  await page.evaluate(() => document.fonts.ready);

  // Every image loaded (including CSS backgrounds), and nothing runs off a page.
  const broken = await page.evaluate(async () => {
    const urls = new Set([...document.images].map((i) => i.src));
    for (const el of document.querySelectorAll("*")) for (const m of getComputedStyle(el).backgroundImage.matchAll(/url\("([^"]+)"\)/g)) urls.add(m[1]);
    const bad = [];
    for (const u of urls) {
      const ok = await new Promise((res) => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = u; });
      if (!ok) bad.push(u);
    }
    return bad;
  });
  const over = await page.$$eval(".page", (pages) => pages.flatMap((p, i) => {
    const box = p.getBoundingClientRect();
    const out = [...p.querySelectorAll("*")].filter((e) => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || e.closest(".photo") || e.classList.contains("mark")) return false;
      return r.bottom > box.bottom - 18 + 0.5 || r.right > box.right + 0.5 || r.left < box.left - 0.5;
    });
    // Blocks placed one above the other must not collide.
    const stacked = [...p.children].filter((e) => getComputedStyle(e).position === "absolute" && !e.classList.contains("photo") && !e.classList.contains("mark"))
      .map((e) => ({ e, r: e.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top);
    const hits = [];
    for (let a = 0; a < stacked.length; a++) for (let b = a + 1; b < stacked.length; b++) {
      const A = stacked[a].r, B = stacked[b].r;
      if (A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom - 0.5) hits.push(`${stacked[a].e.className} overlaps ${stacked[b].e.className}`);
    }
    // A fixed-height card whose content is taller than the card (its last child ends below it).
    const clipped = [...p.querySelectorAll(".pillar, .count > div, .cta")].filter((e) => {
      const r = e.getBoundingClientRect();
      return [...e.querySelectorAll("*")].some((c) => !c.children.length && c.getBoundingClientRect().bottom > r.bottom - 8 + 0.5);   // content, not wrappers
    }).map((e) => `a .${e.className} card's content runs past its bottom`);
    return [...new Set(out.map((e) => `${e.tagName.toLowerCase()}.${e.className}`))].slice(0, 3).map((s) => `page ${i + 1} (${p.dataset.title}): ${s} runs past the edge`)
      .concat(hits.map((h) => `page ${i + 1} (${p.dataset.title}): ${h}`), clipped.map((c) => `page ${i + 1} (${p.dataset.title}): ${c}`));
  }));
  if (broken.length || over.length) {
    fail([...broken.map((s) => `missing image: ${s}`), ...over, "Nothing was written."]);
  } else {
    // Flatten each photo and its gradient into one JPEG, exactly as it looks, with the rest of its page hidden.
    for (const el of await page.$$(".photo")) {
      await el.evaluate((e) => { for (const x of e.closest(".page").querySelectorAll("*")) if (x !== e && !x.contains(e)) { x.dataset.vis = x.style.visibility; x.style.visibility = "hidden"; } });
      const jpeg = await el.screenshot({ type: "jpeg", quality: 90, animations: "disabled" });
      await el.evaluate((e, data) => {
        e.style.backgroundImage = `url(data:image/jpeg;base64,${data})`;
        e.classList.add("flat");
        for (const x of e.closest(".page").querySelectorAll("[data-vis]")) { x.style.visibility = x.dataset.vis; delete x.dataset.vis; }
      }, jpeg.toString("base64"));
    }
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: out, width: "8.5in", height: "11in", printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });

    const pdf = fs.readFileSync(out).toString("latin1");
    const type3 = (pdf.match(/\/Subtype\s*\/Type3/g) || []).length;
    const masks = (pdf.match(/\/Type\s*\/Mask/g) || []).length;
    const fonts = [...new Set([...pdf.matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([\w-]+)/g)].map((m) => m[1]))];
    const strays = fonts.filter((f) => !BRAND_FONTS.test(f));
    if (type3 || masks || strays.length) {
      fs.rmSync(out);
      fail([
        type3 ? `${type3} font${type3 === 1 ? "" : "s"} would be drawn as shapes (Type3): see fonts.css.` : null,
        masks ? `${masks} transparency mask${masks === 1 ? "" : "s"}: a see-through gradient or filter outside .photo. Use the pre-mixed solid colors.` : null,
        strays.length ? `Not a brand font: ${strays.join(", ")}. A character the brand fonts don't have fell back to another font.` : null,
        "Nothing was written.",
      ].filter(Boolean));
    } else {
      let fast;
      const tmp = out + ".fast.pdf";
      try {
        execFileSync("qpdf", ["--linearize", "--object-streams=generate", out, tmp], { stdio: "ignore" });
        execFileSync("qpdf", ["--check", tmp], { stdio: "ignore" });
        execFileSync("qpdf", ["--check-linearization", tmp], { stdio: "ignore" });
        fs.renameSync(tmp, out);
        fast = ", saved for fast opening (checked by qpdf)";
      } catch (err) {
        fs.rmSync(tmp, { force: true });
        fast = err.code === "ENOENT" ? " (install qpdf to also save it for fast opening)" : " (qpdf found a problem with the fast-opening copy, so it was left out)";
      }
      const n = await page.$$eval(".page", (p) => p.length);
      console.log(`${path.relative(process.cwd(), out)}: ${n} pages, ${(fs.statSync(out).size / 1048576).toFixed(1)} MB, brand fonts only (${fonts.join(", ")}), no transparency, QR → ${link}${forName ? `, prepared for ${forName}` : ""}${fast}.`);
    }
  }
} finally {
  await browser.close();
}
