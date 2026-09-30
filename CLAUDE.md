# Nobleman Productions website — project notes

Marketing site for Nobleman Productions (Jean and Justin; veteran owned; San Diego and Las Vegas). Operated by Alexis / GotIT2Work.

## Ownership and infrastructure

- **Alexis owns `gotit2work.com`.** DNS is at GoDaddy (`ns17/ns18.domaincontrol.com`).
  - Apex `gotit2work.com` → `185.158.133.1` (hosted on Lovable). Don't change it.
  - Email is Microsoft 365: MX `gotit2work-com.mail.protection.outlook.com`, SPF `v=spf1 include:spf.protection.outlook.com -all`, DMARC `p=none`. Don't change the root SPF; Resend uses its own `send.` subdomain records.
- This site: `noblemanproductions.gotit2work.com` (CNAME to Vercel).
- Client portal: `portal.noblemanproductions.gotit2work.com`, repo `Gotit2work/nobleman-portal`.
- Vercel: account `amangual1`, team slug `gotit2-work`. The team was on Hobby as of 2026-09-30; Vercel restricts Hobby to non-commercial use, so production needs Pro.
- Hero video: Vimeo `1197058424`, hash `796798a19d`, Jean's account (`jeangotay`, Vimeo Plus).
- Full setup, validation, and rollback: `docs/DEPLOYMENT.md`.

## How the pages work

- Each page is static HTML rendered in the browser by `support.js`, a generated "dc-runtime". Don't edit it by hand. Templates live inside `<x-dc>`; the logic is the `class Component extends DCLogic` script.
- `SiteChrome.dc.html` and `SiteFooter.dc.html` are fetched at runtime by relative URL and must stay at the repo root.
- React 18.3.1 is vendored in `vendor/`, byte-identical to the unpkg builds pinned by SRI in `support.js`. Loading it before `support.js` makes the runtime skip its CDN fetch.
- **Never put `<link rel="stylesheet">` or a synchronous `<script src>` inside `<helmet>`.** The browser parses it inside `<body>` and delays `DOMContentLoaded`, which is when the runtime boots, so the page stays blank until that request finishes. Put such things in the static `<head>`, async or non-blocking.
- The iframes in the raw template start loading during HTML parse. That is why `/work` logs a harmless 404 for a literal `{{ w.embed }}` URL.

## Conventions

- Photos: JPEG, mozjpeg quality 88, 4:4:4 chroma, alpha removed. WebP was rejected because it smears the dark footage.
- Cache headers: `vendor/` is immutable (versioned file names); `media/` and `assets/` get 7 days. Give an image a new file name if it must change right away.
- `.vercelignore` keeps `README.md`, `CLAUDE.md`, and `docs/` out of the public deployment.

## Verifying changes

There is no test suite. What worked before:
- A small local server that mimics Vercel's `cleanUrls` routing and runs `api/*.js` handlers, then Playwright with the preinstalled Chromium (`/opt/pw-browsers`). Check every page on desktop (1440 wide) and mobile (390 wide), including console errors, broken images, and horizontal scroll.
- `npx vercel build` with a hand-written `.vercel/project.json` (`{"projectId":"x","orgId":"y","settings":{"framework":null}}`), then read `.vercel/output/config.json` to confirm routes and headers.
