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
- `/privacy` → privacy.html (what both sites collect, cookies and storage, providers, retention, choices)
- `/start` → start.html (intake form)
- `/sitemap` → sitemap.html (the human site map: an “I want to…” finder, then every page with deep links into its sections); `/sitemap.xml` is the search-engine version
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

The player creates the iframe only when a film is opened and removes it on close, so no third-party player loads until someone asks for one and closing always stops playback. YouTube plays from `youtube-nocookie.com`; Vimeo with `dnt=1`. Escape, the × button, and a click on the backdrop all close it. The page scroll is locked while it is open. On close it dispatches `np:closed` on `window`, so a page can react (the home page's mini player listens for `np:play` and `np:closed`).

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
- **The REC dot.** The *i* in the home headline's "production." wears the red REC light instead of its own dot (`class="np-rec-i"`). The text stays a real "i"; CSS hides the glyph's dot and draws the red one at offsets measured from Cormorant Garamond Italic, so it only switches on once that font has loaded (`np-serif` on `<html>`). If the headline font or size changes, re-measure.
- **Keep a space between split lines.** Headlines split into animated lines (`np-line`) need a real space at the end of each line, or the text reads as one run-on word to Google and screen readers.
- **Safety.** Motion only applies once `np.js` adds `np-motion` to `<html>`. It skips that for visitors with reduced motion turned on, and if the script doesn't load nothing is hidden.
- **Don't hide a revealing element with `clip-path`.** IntersectionObserver measures the clipped area, so a clipped element can look off-screen and never reveal. Use a mask (as `"title"` does) or transform/filter.
- **Changing these files:** bump the `?v=` number in every page's `<link>`/`<script>` tag. `assets/` is cached for 7 days.

## Writing

Every word on the site follows [docs/WRITING.md](docs/WRITING.md), a set of rules drawn from the *Murphy's Laws on Technology* poster: say it plainly, name the action on every button, promise only what is always true, plan for the mistake, and proofread. Check new copy against its checklist.

## Site map and deep links

`/sitemap` is for people; `/sitemap.xml` is for search engines. The footer, the Company menu (desktop and mobile), the privacy page and the 404 page all link to `/sitemap`.

Its "Jump to" buttons link into page sections by id: `/#services`, `/#crew`, `/#credentials`, `/#process`, `/#featured`, `/work#films`, `/about#story|founders|credentials|markets`, and on each service page `#what-you-get`, `#who-its-for`, `#how-it-works`, `#questions`. The runtime renders pages after load, so the browser's own jump to a `#id` finds nothing; `assets/np.js` scrolls to the section once it exists and holds it there while images and fonts settle (about 3 s, until the visitor scrolls). `section[id]` has a `scroll-margin-top` in `np.css` so the heading clears the fixed header. Renaming or removing a section id breaks its link on the site map.

## Privacy notice

`privacy.html` describes what the code actually does, and nothing more: the form's fields, Vercel's request logs, no cookies on this site, the portal's `np_session` cookie and its two browser-storage keys (`np-review-time`, `np-portal-seen`), the providers (Vercel, Resend, Microsoft 365, Google Fonts, Vimeo, YouTube, and Neon for the real portal), retention, and how to ask for changes. When a change adds a cookie, storage key, tracker, provider, or new data the portal keeps, update the page and its date in the same change. The portal links to `/privacy#portal` from sign-in, Help, and Account.

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

- An error is final. In a browser that can't decode the film (Chromium without H.264, for instance), Vimeo reports `PlaybackError` and then keeps its clock running, and sending `timeupdate`, behind its own error screen. So `timeupdate` after an error isn't treated as proof of a picture.

**Mini player (desktop home page only).** As soon as the hero has completely left the screen, the film carries on from the second it was at, in a small square card in the bottom-right corner with a **Start a project** button under it (`[data-pip]` in `index.html`). Pressing the video opens the same film full size with sound in the shared player; × hides it for the rest of the visit. It hides again the moment any of the hero is back in view and when the footer comes into view (the footer has its own Start button). Desktop means a mouse or trackpad (`(hover: hover) and (pointer: fine)`) and at least 900 px wide: never on phones, tablets, or other pages.

How it works, and why:
- It is its own Vimeo player. The hero's iframe sits inside a `container-type` wrapper and a scaled layer, and both trap `position:fixed`, so the hero's player can't simply be moved to the corner.
- Scrolling back up, the hero carries on from where the mini got to: if the two are more than 2 s apart (a browser may hold an off-screen video still), the hero is seeked to the mini's last reported time. A seek only, never pause or play.
- The hero is never paused. A Vimeo background player that has been paused via the API may not resume on command (seen in testing: `play()` never settles), which would leave the hero frozen. Instead the mini is created fresh each time it docks, starting at the hero's current second (`#t=`), and removed when it undocks, so there is only a second stream while the card is visible. Both run on the same clock and stay in step.
- Opening any film removes the mini's stream; closing the film (`np:closed`) brings it back.
- It shows a still frame and the button, with no second video, under `prefers-reduced-motion`, if the hero film already failed in this browser, or if the mini reports an error.
- No new cookies or storage: the embed uses `dnt=1` like the hero, and the close state lives only in memory for the visit.

If the hero video changes, regenerate the poster from the new video's thumbnail (oEmbed `thumbnail_url`, with the size suffix changed to `_1920x1080`), resize it to 1440 px wide, and save it as JPEG at about 76 quality.

## Images

Photos in `media/` are JPEG (mozjpeg, quality 88, 4:4:4 chroma), 40–120 KB each; the originals were 1.2–2.3 MB PNGs. WebP was tested and rejected: it visibly smeared the dark water textures even at quality 95. The seven icon masks `a12`–`a18` stay PNG.

## Navigation icons

The bottom bar, the mobile sheets, and the desktop mega-menu use `media/icons/*.png`: white on transparent, 192 px, applied as CSS masks so they take the header's colour. Each icon says what it is, built from a maritime object:

| Icon | Used for |
|---|---|
| anchor (home port) | Home (the same icon the client portal uses for Home) |
| camera with a ship's-wheel reel | Services |
| play button in a porthole | Work |
| sailors in caps | About / About us |
| pennant flag with a play button | YouTube Channel Retainers |
| lighthouse broadcasting | Live Production |
| microphone on an anchor | Conference & Event Video |
| maritime signal flags | Site map |
| paper boat | Start a project |
| sailboat on waves | Nobleman Sailing Media |
| key with a ship's-wheel bow | Client portal |

Decorative metaphors alone (a compass for Work, a ship's wheel for Services) looked nice but didn't say where a link went. Plain UI icons read fine but looked generic. This set does both.

They were generated as one 4×3 sheet with Higgsfield (Recraft V4.1, vector mode), so every icon shares one solid style; the source is `docs/nav-icons/sheet.svg`. `docs/nav-icons/slice-icons.mjs` finds each icon from the ink, scales it into a 150 px live area on a 192 px canvas, and turns darkness into alpha, so cut-out details stay transparent. It reproduces the shipped files byte for byte. The sheet also has a spare message-in-a-bottle icon (the anchor is now Home). To change one icon, regenerate the whole sheet with the same prompt so the style matches, and give changed files a new path (`media/` is cached for 7 days).

The mobile bar is Home · Services · Work · About · Start, and highlights the current section (Home on `/`, Services on any service page, Work on `/work`, About on `/about`, `/privacy` and `/sitemap`); an open sheet highlights its own tab. The desktop pill marks the same section with a soft background. The ship mark in the Start buttons is static and sits inline, centred on the word.

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
- **Privacy notice needs an owner and legal review.** It matches what both sites do today (see "Privacy notice" above), names GotIT2Work as the operator and alexis@gotit2work.com as the contact, and states choices the owners should confirm: how long inquiries are kept, replying "usually within a few business days", and Neon as the future portal database. Nobody has checked which state laws (California, Nevada) apply to the business. It is not legal advice.
- There is no Terms page and no Instagram link: no confirmed Instagram account for Nobleman Productions was found, so the link was removed rather than guessed.
- The "Also offered" services in the nav (social packages, executive interviews, photography, documentaries) link to `/start` rather than to pages of their own.
- Inquiries go to alexis@gotit2work.com; noblemanproductions.com publishes info@noblemanproductions.com. Pick one before launch.
- Much of the copy repeats noblemanproductions.com word for word. If both sites stay public, search engines treat one as a duplicate; decide which is canonical, or rewrite.
