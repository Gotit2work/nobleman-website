# Nobleman Productions — Website

Static pages plus one serverless function for the intake form. Vercel runs `npm install`; there is no build step.
Live at `https://noblemanproductions.gotit2work.com`. **Deploying from scratch: follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).**

Pages
- `/` → index.html (Home)
- `/work` → work.html
- `/services` → services.html
- `/start` → start.html (intake form)
- anything else → 404.html (static, no runtime)

`SiteChrome.dc.html`, `SiteFooter.dc.html`, and `support.js` are the shared nav, footer, and rendering runtime. All must stay at the repo root. With `cleanUrls` on, Vercel serves the components at `/SiteChrome.dc` and `/SiteFooter.dc` (the runtime's request for the `.html` name is answered with a 308 redirect, which browsers cache).

`vendor/` holds React 18.3.1 so pages don't depend on unpkg being up. The files are byte-identical to the unpkg builds `support.js` pins by SRI hash. The version is in the file name, so they can be cached forever.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | yes | resend.com → API Keys |
| `INTAKE_TO` | no | Defaults to `alexis@gotit2work.com` |
| `INTAKE_FROM` | no | Defaults to `Nobleman Productions <noreply@gotit2work.com>`. Must be on a domain verified in Resend |

**Verify the domain first.** In Resend, add `gotit2work.com` and publish the DNS records it gives you (details in the runbook; the root SPF record stays as it is). Until that is done, sending fails and the form shows an error telling the visitor to email Alexis directly.

## How the intake form behaves

`POST /api/intake` sends two emails: the inquiry to `INTAKE_TO` with the visitor's address as reply-to, and a confirmation to the visitor. A hidden honeypot field drops the most basic bots. Fields are length-capped and stripped of control characters. The confirmation only greets the visitor by first name when it looks like a name, so the form can't be used to relay spam text to an arbitrary address. Submissions are not stored anywhere — if you want a record beyond email, that needs a database.

## How the hero video loads

The goal is that the header looks finished on the first paint and the reel takes over without a visible cut.

- `media/hero-poster.jpg` is the reel's own Vimeo thumbnail. It is preloaded at high priority from `<head>`, so it is on screen as soon as the page renders.
- The Vimeo iframe is created on the first render (it used to wait a fixed 900 ms).
- The iframe stays transparent until Vimeo's player API reports `playing`, then fades in over the poster. If that never happens (autoplay blocked, API unreachable), it is shown anyway after 6 s.
- Google Fonts load asynchronously from `<head>`. Don't put a `<link rel="stylesheet">` or a plain `<script src>` inside a page's `<helmet>`: the browser parses that block as part of `<body>` and holds `DOMContentLoaded`, and the whole page stays blank until that request finishes.

If the hero video changes, regenerate the poster from the new video's thumbnail (oEmbed `thumbnail_url`, with the size suffix changed to `_1920x1080`), resize it to 1440 px wide, and save it as JPEG at about 76 quality.

## Images

Photos in `media/` are JPEG (mozjpeg, quality 88, 4:4:4 chroma), 40–120 KB each; the originals were 1.2–2.3 MB PNGs. WebP was tested and rejected: it visibly smeared the dark water textures even at quality 95. The seven icon masks `a12`–`a18` stay PNG.

## Still unfinished

- `/work`: 7 of 8 tiles are striped placeholders waiting for real YouTube/Vimeo links.
- Placeholder `#` links: About, Nobleman Sailing Media, the "Also offered" services, Drone, YouTube, Instagram, Privacy, Terms, Sitemap.
- `/services` covers only the YouTube retainer; all three service cards link to it.
