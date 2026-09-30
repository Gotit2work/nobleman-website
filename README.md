# Nobleman Productions — Website

Static pages plus one serverless function for the intake form. Vercel runs `npm install`; there is no build step.
Live at `https://noblemanproductions.gotit2work.com`. **Deploying from scratch: follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).**

Pages
- `/` → index.html (Home: hero reel, credits band, featured films, services, receipts)
- `/work` → work.html (nine films with filters)
- `/services` → services.html (YouTube retainers; `/youtube-retainers` serves the same page)
- `/live-production` → live-production.html
- `/conference-event` → conference-event.html (conference, event, and drone coverage)
- `/about` → about.html
- `/privacy` → privacy.html
- `/start` → start.html (intake form)
- anything else → 404.html (static, no runtime)

Service and About copy was adapted from noblemanproductions.com. Live production, conference/event, About, and Privacy were generated from shared templates during the build-out; they are ordinary HTML now, so edit them directly.

`SiteChrome.dc.html`, `SiteFooter.dc.html`, `VideoPlayer.dc.html`, and `support.js` are the shared nav, footer, film player, and rendering runtime. All must stay at the repo root; the runtime fetches the `.dc.html` files by those exact names.

## How films play

Every film on the site opens in one shared full-screen player, `VideoPlayer.dc.html`. A page includes it with `<dc-import name="VideoPlayer">` and opens a film by dispatching an event:

```js
window.__npQueued = film;  // picked up if the player hasn't loaded yet
window.dispatchEvent(new CustomEvent("np:play", { detail: film }));
// film = { provider: "vimeo" | "youtube", id, hash?, title, meta? }
```

The player creates the iframe only when a film is opened and removes it on close, so no third-party player loads until someone asks for one and closing always stops playback. YouTube plays from `youtube-nocookie.com`; Vimeo with `dnt=1`. Escape, the × button, and a click on the backdrop all close it. The page scroll is locked while it is open.

Place the `<dc-import>` outside any element with `container-type` set (see `index.html`): containment makes that element the containing block for `position:fixed`, and the player would be trapped inside it.

Film thumbnails in `media/work-*.jpg` are 960×540 JPEGs taken from each film's YouTube or Vimeo thumbnail.

**Clean URLs are explicit in `vercel.json`, on purpose.** Vercel's `cleanUrls` setting would redirect every `.html` request, which puts an extra round trip in front of the nav and footer on every first visit. Instead, each page name is a rewrite and `/<page>.html` redirects to them. **Adding a page means adding its name to both patterns in `vercel.json`.**

`vendor/` holds React 18.3.1 so pages don't depend on unpkg being up. The files are byte-identical to the unpkg builds `support.js` pins by SRI hash. The version is in the file name, so they can be cached forever.

## Type and motion

`assets/np.css` and `assets/np.js` hold the site's typography and motion, and every page loads both from `<head>` (the script with `defer`, so it runs before the runtime renders).

- **Type.** Headlines (`h1`, `h2`, and anything with `class="np-display"`) are Cormorant Garamond, a classical display serif that echoes the Nobleman wordmark; `class="np-it"` is its italic. Body text stays Inter.
- **Reveals.** Put `data-reveal` on an element and it animates in as it scrolls into view: `""` (rise and unblur), `"card"` (flies up with a 3D tilt), `"left"`/`"right"`, `"title"` (rises out of a soft mask), `"zoom"`. Items entering together are staggered. Scrolling back up sends them out again at the bottom edge, so they fly in again next time.
- **Parallax.** `data-parallax="20"` drifts an element up to 20 px against the scroll; give it spare size inside an `overflow:hidden` frame.
- **Landing.** On the home page, `data-letterbox`, `data-hero-zoom`, `data-hero-media`, `data-hero-content` and `data-intro="0..7"` drive the opening sequence and the hero's scroll effect. It waits for the display font (at most about a second), so headlines never swap typeface mid-animation.
- **Safety.** Motion only applies once `np.js` adds `np-motion` to `<html>`. It skips that for visitors with reduced motion turned on, and if the script doesn't load nothing is hidden.
- **Don't hide a revealing element with `clip-path`.** IntersectionObserver measures the clipped area, so a clipped element can look off-screen and never reveal. Use a mask (as `"title"` does) or transform/filter.
- **Changing these files:** bump the `?v=` number in every page's `<link>`/`<script>` tag. `assets/` is cached for 7 days.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | yes | resend.com → API Keys |
| `INTAKE_TO` | no | Defaults to `alexis@gotit2work.com` |
| `INTAKE_FROM` | no | Defaults to `Nobleman Productions <noreply@gotit2work.com>`. Must be on a domain verified in Resend |

**Verify the domain first.** In Resend, add `gotit2work.com` and publish the DNS records it gives you (details in the runbook; the root SPF record stays as it is). Until then the form tells visitors inquiries aren't switched on yet and to email alexis@gotit2work.com directly; if the key is set but the domain isn't verified, sending fails with a similar message.

## How the intake form behaves

`POST /api/intake` sends two emails: the inquiry to `INTAKE_TO` with the visitor's address as reply-to, and a confirmation to the visitor. A hidden honeypot field drops the most basic bots. Fields are length-capped and stripped of control characters. The confirmation only greets the visitor by first name when it looks like a name, so the form can't be used to relay spam text to an arbitrary address. Submissions are not stored anywhere — if you want a record beyond email, that needs a database.

## How the hero video loads

The goal is that the header looks finished on the first paint and the reel takes over without a visible cut.

- `media/hero-poster.jpg` is the reel's own Vimeo thumbnail. It is preloaded at high priority from `<head>`, so it is on screen as soon as the page renders.
- The Vimeo iframe is created on the first render (it used to wait a fixed 900 ms).
- The iframe stays transparent until Vimeo's player API reports `playing` (or the first `timeupdate`), then fades in over the poster. If playback never starts (autoplay blocked, Vimeo unreachable), the poster simply stays. There is deliberately no timed fallback: showing the iframe early exposed Vimeo's grey "player error" box instead of the poster.
- Google Fonts load asynchronously from `<head>`. Don't put a `<link rel="stylesheet">` or a plain `<script src>` inside a page's `<helmet>`: the browser parses that block as part of `<body>` and holds `DOMContentLoaded`, and the whole page stays blank until that request finishes.

If the hero video changes, regenerate the poster from the new video's thumbnail (oEmbed `thumbnail_url`, with the size suffix changed to `_1920x1080`), resize it to 1440 px wide, and save it as JPEG at about 76 quality.

## Images

Photos in `media/` are JPEG (mozjpeg, quality 88, 4:4:4 chroma), 40–120 KB each; the originals were 1.2–2.3 MB PNGs. WebP was tested and rejected: it visibly smeared the dark water textures even at quality 95. The seven icon masks `a12`–`a18` stay PNG.

## Share image

`og-logo.jpg` (1200×630) is the preview shown when a page is shared: the white logo (`assets/Nobleman_Logo_White.png`) at 720 px wide, centred on the dark water texture with a soft teal lift and darkened edges. Every page's `og:image` and `twitter:image` point at it. If it changes, save it under a **new file name** and update those tags: Facebook, LinkedIn, and iMessage cache preview images by URL. The water background came from the previous `og.jpg` (in git history). To refresh a preview that's already cached, use Facebook's Sharing Debugger or LinkedIn's Post Inspector.

## Client logos

The band under the home hero shows past clients' logos, white on transparent, from `media/logos/`. The list, file names, and per-logo heights are `brands` in `index.html`'s logic. The heights are optical: tall emblems are larger and long wordmarks smaller, so every mark reads with similar weight. All are genuine marks, none redrawn:

| Logo | Source |
|---|---|
| Lamborghini, Maserati | simple-icons (CC0 files; the marks are the brands' trademarks) |
| Harley-Davidson | harley-davidson.com site header SVG |
| Waldorf Astoria | hilton.com logo SVG |
| The Ocean Race | vector from the race's official 2019–20 report (no genuine Volvo Ocean Race-era vector was found; the race was renamed in 2019, and the alt text says "formerly Volvo Ocean Race") |
| Transpac | vector from the 2025 Transpac race program (year line removed) |
| EcoFlow, Satellite Phone Store | the companies' site header SVGs |
| MCT | mct-trading.com logo PNG (no vector exists) |

To add one: make it single-colour white on transparent with a tight `viewBox` and no width/height, add it to `brands` with its aspect ratio, and check it at 40 px on the dark background.

## Still unfinished

- **Client logos need the owners' OK.** Showing a brand's logo implies a working relationship. Confirm each one is a real Nobleman client and that no contract restricts using its logo.
- **Privacy policy needs an owner review.** It describes what the site actually does (Resend email, Vercel logs, Google Fonts, privacy-enhanced YouTube and Vimeo embeds) and names alexis@gotit2work.com as the contact. It is not legal advice.
- There is no Terms page and no Instagram link: no confirmed Instagram account for Nobleman Productions was found, so the link was removed rather than guessed.
- The "Also offered" services in the nav (social packages, executive interviews, photography, documentaries) link to `/start` rather than to pages of their own.
- Inquiries go to alexis@gotit2work.com; noblemanproductions.com publishes info@noblemanproductions.com. Pick one before launch.
- Much of the copy repeats noblemanproductions.com word for word. If both sites stay public, search engines treat one as a duplicate; decide which is canonical, or rewrite.
