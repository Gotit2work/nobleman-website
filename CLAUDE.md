# Nobleman Productions website — project notes

Marketing site for Nobleman Productions (Jean and Justin; veteran owned; San Diego and Las Vegas). Operated by Alexis / GotIT2Work.

## Ownership and infrastructure

- Vercel project `nobleman-website` (`prj_gqDhfZOcMh5eEmr2LS990DiHcgKx`), created 2026-09-30 in team `gotit2-work`: framework Other, Node 22.x, Vercel Authentication on previews only (production is public), custom domain attached and ownership-verified. Linked to GitHub (`Gotit2work/nobleman-website`, made public so Hobby can deploy it); pushes to `main` deploy to production.
- **Alexis owns `gotit2work.com`.** DNS is at GoDaddy (`ns17/ns18.domaincontrol.com`).
  - Apex `gotit2work.com` → `185.158.133.1` (hosted on Lovable). Don't change it.
  - Email is Microsoft 365: MX `gotit2work-com.mail.protection.outlook.com`, SPF `v=spf1 include:spf.protection.outlook.com -all`, DMARC `p=none`. Don't change the root SPF; Resend uses its own `send.` subdomain records.
- This site: `noblemanproductions.gotit2work.com`. Client portal: `portal.noblemanproductions.gotit2work.com`, repo `Gotit2work/nobleman-portal`.
- **Moving to the studio's own domain, `noblemanproductions.com`: follow `docs/MOVE.md`.** Every address in the code changes with `node scripts/move-domain.mjs --apply` (the same script is in the portal repo); never change them one by one. Lines that must keep the old address carry `move-domain:keep`. Old addresses stay attached in Vercel after the move: the old website address redirects, and the old portal address keeps answering (Stripe and Adobe call it) while the portal sends visitors on.
  - `noblemanproductions.com` DNS is at GoDaddy (`ns75/ns76.domaincontrol.com`, a separate account from gotit2work.com). Today `@` and `www` point at Lovable (`185.158.133.1`, the studio's current site). **Its MX is the studio's Google Workspace Gmail: never touch MX, the `google-site-verification` TXT, or `send.` records.**
  - The old Lovable site's pages are redirected in `vercel.json` (`/work-samples`, `/voice-samples` → `/work`; `/contact`, `/quote` → `/start`); `/youtube-retainers` serves Services. Keep them.
- The gotit2work.com records for this site: GoDaddy CNAME `noblemanproductions` → `cname.vercel-dns.com` (certificate issued).
- Vercel: account `amangual1`, team `Gotit2Work` (slug `gotit2-work`, id `team_b7Eucmxp9X2SzzAHXZPA92Qh`). On Hobby by the owner's choice while this is a pre-launch preview; Vercel restricts Hobby to non-commercial use, so upgrade to Pro before marketing the site.
- Hero video: Vimeo `1197058424`, hash `796798a19d`, Jean's account (`jeangotay`, Vimeo Plus).
- Full setup, validation, and rollback: `docs/DEPLOYMENT.md`.

## How the pages work

- Each page is static HTML rendered in the browser by `support.js`, a generated "dc-runtime". Don't edit it by hand. Templates live inside `<x-dc>`; the logic is the `class Component extends DCLogic` script.
- `SiteChrome.dc.html` and `SiteFooter.dc.html` are fetched at runtime by relative URL and must stay at the repo root. Don't turn on `cleanUrls`: it would 308 those fetches. Page routes are explicit rewrites in `vercel.json`, and a new page must be added to both patterns there.
- React 18.3.1 is vendored in `vendor/`, byte-identical to the unpkg builds pinned by SRI in `support.js`. Loading it before `support.js` makes the runtime skip its CDN fetch.
- **Never put `<link rel="stylesheet">` or a synchronous `<script src>` inside `<helmet>`.** The browser parses it inside `<body>` and delays `DOMContentLoaded`, which is when the runtime boots, so the page stays blank until that request finishes. Put such things in the static `<head>`, async or non-blocking.
- The browser parses the raw template before the runtime renders it, so a bound `src="{{ x }}"` is requested literally (a 404 per load). Don't bind `src`: use a CSS `background:url('{{ x }}')`, create the element in code (as `VideoPlayer.dc.html` does with its iframe), or write `sc-camel-src="{{ x }}"`, which the runtime maps to `src` and the browser ignores.
- Films open in the shared `VideoPlayer.dc.html` via a `np:play` window event, and it dispatches `np:closed` on close (README, "How films play"). Keep its `<dc-import>` outside any `container-type` element, or its `position:fixed` overlay is trapped inside it.
- The home page's desktop mini player (`[data-pip]`, README "Mini player") is a second Vimeo player created on dock and removed on undock. Never pause the hero's Vimeo background player to hand playback over: it may not resume. Keep the mini outside the `container-type` wrapper.
- The nav/footer colour theme follows `data-theme` sections under the header. Hidden elements report a top of 0, so the check skips anything without client rects; keep that when touching it.
- New pages: add the name to both patterns in `vercel.json`, to `sitemap.xml`, and a card to `sitemap.html` (the human site map).
- Section ids (`/services#questions`, README "Site map and deep links") are link targets for the site map; `np.js` scrolls to them after the runtime renders. Don't rename one without updating `sitemap.html`.
- `privacy.html` must match what the code collects. Adding a cookie, storage key, tracker, third-party service, or new portal data means updating it (and its date) in the same change.
- Typography and motion live in `assets/np.css` + `assets/np.js`, loaded by every page (README, "Type and motion"). Animate with `data-reveal`/`data-parallax` attributes, not per-page observers. Never hide a `data-reveal` element with `clip-path` (IntersectionObserver then never sees it). Bump `?v=` on every page when those files change.
- Client logos in the home band are genuine marks, white on transparent, in `media/logos/` (sources in the README). Never redraw or substitute a logo; if a genuine one can't be found, leave the brand out.
- Nav icons (`media/icons/*.png`, README "Navigation icons") must say what they are at 27 px while keeping the maritime style; never a pure metaphor (a compass for Work). Regenerate the whole sheet to change one, so the style stays consistent.
- The desktop header is a compact pill that hugs its content (`data-navpill`): Home · Services ▾ · Work · About ▾ · Log in · Start a project. “Log in” goes to the portal’s login (`/signin`), the same door for clients and staff; the About menu’s portal card and the site map go to the demo (`/demo`). The mega-menus drop below it as their own panels. Keep it compact; the regression script asserts it is under 820 px wide.
- Menus open on hover, and a click on a hover-opened trigger pins it open (`hoverOpen`/`clickMenu` in `SiteChrome.dc.html`). Never go back to a plain toggle on click: people hover then click, and the toggle closed the menu they had just opened. Closed panels are `visibility:hidden` so their links can't take keyboard focus.
- The Services menu, the home cards, and each service page lead with the three pillars, and the home hero keeps to one short line and two buttons (Start a project, Watch the reel); each pillar has one Murphy's-law line (`docs/WRITING.md`, "Voice"). Keep those lines word for word everywhere they appear.

## Conventions

- All visible copy follows `docs/WRITING.md` (the Murphy's Laws rules): plain words, action-named buttons, no promise that isn't always true ("usually the same business day", "when planned into the shoot"), nothing described that doesn't exist. Run its checklist before shipping copy.

- The client welcome PDF (`docs/welcome/`, README "Client welcome PDF") repeats the site's services, credentials, and numbers. When those change on the site, change `welcome.html` too and rebuild with `node build.mjs`; its checks must pass.
- Photos: JPEG, mozjpeg quality 88, 4:4:4 chroma, alpha removed. WebP was rejected because it smears the dark footage.
- Cache headers: `vendor/` is immutable (versioned file names); `media/` and `assets/` get 7 days. Give an image a new file name if it must change right away.
- `.vercelignore` keeps `README.md`, `CLAUDE.md`, and `docs/` out of the public deployment.

## Verifying changes

There is no test suite. What worked before:
- A small local server that mimics Vercel's routing (clean page URLs, `.html` redirects) and runs `api/*.js` handlers, then Playwright with the preinstalled Chromium (`/opt/pw-browsers`). Check every page on desktop (1440 wide) and mobile (390 wide), including console errors, broken images, and horizontal scroll.
- `npx vercel build` with a hand-written `.vercel/project.json` (`{"projectId":"x","orgId":"y","settings":{"framework":null}}`), then read `.vercel/output/config.json` to confirm routes and headers.
