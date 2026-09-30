# Nobleman Productions website — project notes

Marketing site for Nobleman Productions (Jean and Justin; veteran owned; San Diego and Las Vegas). Operated by Alexis / GotIT2Work.

## Ownership and infrastructure

- Vercel project `nobleman-website` (`prj_gqDhfZOcMh5eEmr2LS990DiHcgKx`), created 2026-09-30 in team `gotit2-work`: framework Other, Node 22.x, Vercel Authentication on previews only (production is public), custom domain attached and ownership-verified. Linked to GitHub (`Gotit2work/nobleman-website`, made public so Hobby can deploy it); pushes to `main` deploy to production.
- **Alexis owns `gotit2work.com`.** DNS is at GoDaddy (`ns17/ns18.domaincontrol.com`).
  - Apex `gotit2work.com` → `185.158.133.1` (hosted on Lovable). Don't change it.
  - Email is Microsoft 365: MX `gotit2work-com.mail.protection.outlook.com`, SPF `v=spf1 include:spf.protection.outlook.com -all`, DMARC `p=none`. Don't change the root SPF; Resend uses its own `send.` subdomain records.
- This site: `noblemanproductions.gotit2work.com` (GoDaddy CNAME `noblemanproductions` → `cname.vercel-dns.com`; certificate issued).
- Client portal: `portal.noblemanproductions.gotit2work.com`, repo `Gotit2work/nobleman-portal`.
- Vercel: account `amangual1`, team `Gotit2Work` (slug `gotit2-work`, id `team_b7Eucmxp9X2SzzAHXZPA92Qh`). On Hobby by the owner's choice while this is a pre-launch preview; Vercel restricts Hobby to non-commercial use, so upgrade to Pro before marketing the site.
- Hero video: Vimeo `1197058424`, hash `796798a19d`, Jean's account (`jeangotay`, Vimeo Plus).
- Full setup, validation, and rollback: `docs/DEPLOYMENT.md`.

## How the pages work

- Each page is static HTML rendered in the browser by `support.js`, a generated "dc-runtime". Don't edit it by hand. Templates live inside `<x-dc>`; the logic is the `class Component extends DCLogic` script.
- `SiteChrome.dc.html` and `SiteFooter.dc.html` are fetched at runtime by relative URL and must stay at the repo root. Don't turn on `cleanUrls`: it would 308 those fetches. Page routes are explicit rewrites in `vercel.json`, and a new page must be added to both patterns there.
- React 18.3.1 is vendored in `vendor/`, byte-identical to the unpkg builds pinned by SRI in `support.js`. Loading it before `support.js` makes the runtime skip its CDN fetch.
- **Never put `<link rel="stylesheet">` or a synchronous `<script src>` inside `<helmet>`.** The browser parses it inside `<body>` and delays `DOMContentLoaded`, which is when the runtime boots, so the page stays blank until that request finishes. Put such things in the static `<head>`, async or non-blocking.
- The browser parses the raw template before the runtime renders it, so a bound `src="{{ x }}"` is requested literally (a 404 per load). Don't bind `src`: use a CSS `background:url('{{ x }}')`, create the element in code (as `VideoPlayer.dc.html` does with its iframe), or write `sc-camel-src="{{ x }}"`, which the runtime maps to `src` and the browser ignores.
- Films open in the shared `VideoPlayer.dc.html` via a `np:play` window event (README, "How films play"). Keep its `<dc-import>` outside any `container-type` element, or its `position:fixed` overlay is trapped inside it.
- The nav/footer colour theme follows `data-theme` sections under the header. Hidden elements report a top of 0, so the check skips anything without client rects; keep that when touching it.
- New pages: add the name to both patterns in `vercel.json`, and to `sitemap.xml`.

## Conventions

- Photos: JPEG, mozjpeg quality 88, 4:4:4 chroma, alpha removed. WebP was rejected because it smears the dark footage.
- Cache headers: `vendor/` is immutable (versioned file names); `media/` and `assets/` get 7 days. Give an image a new file name if it must change right away.
- `.vercelignore` keeps `README.md`, `CLAUDE.md`, and `docs/` out of the public deployment.

## Verifying changes

There is no test suite. What worked before:
- A small local server that mimics Vercel's routing (clean page URLs, `.html` redirects) and runs `api/*.js` handlers, then Playwright with the preinstalled Chromium (`/opt/pw-browsers`). Check every page on desktop (1440 wide) and mobile (390 wide), including console errors, broken images, and horizontal scroll.
- `npx vercel build` with a hand-written `.vercel/project.json` (`{"projectId":"x","orgId":"y","settings":{"framework":null}}`), then read `.vercel/output/config.json` to confirm routes and headers.
