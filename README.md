# Nobleman Productions — Website

Static pages plus one serverless function for the intake form. Vercel runs `npm install`; there is no build step.

Pages
- `/` → index.html (Home)
- `/work` → work.html
- `/services` → services.html
- `/start` → start.html (intake form)

`SiteChrome.dc.html`, `SiteFooter.dc.html`, and `support.js` are the shared nav, footer, and rendering runtime. All must stay at the repo root.

## Push to GitHub

```bash
cd website
git init
git add .
git commit -m "Nobleman website"
git branch -M main
git remote add origin git@github.com:Gotit2work/nobleman-website.git
git push -u origin main
```

## Deploy on Vercel

1. vercel.com → Add New → Project → Import `nobleman-website`
2. Framework Preset **Other**. Leave Build Command and Output Directory empty.
3. Add the environment variables below, then Deploy.
4. Settings → Domains → add `noblemanproductions.gotit2work.com`.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | yes | resend.com → API Keys |
| `INTAKE_TO` | no | Defaults to `alexis@gotit2work.com` |
| `INTAKE_FROM` | no | Defaults to `noreply@gotit2work.com`. Must be on a domain you verified in Resend |

**Verify the domain first.** In Resend, add `gotit2work.com` and publish the DNS records it gives you. Until that is done, sending fails and the form shows an error telling the visitor to email Alexis directly.

## How the intake form behaves

`POST /api/intake` sends two emails: the inquiry to `INTAKE_TO` with the visitor's address as reply-to, and a confirmation to the visitor. A hidden honeypot field drops the most basic bots. Submissions are not stored anywhere — if you want a record beyond email, that needs the database.

## Image weight

The photos in `media/` are PNGs between 1.2 and 2.3 MB — about 25 MB for the repo. They were recovered from a temporary CDN and there was no JPEG encoder available to convert them. Before you push traffic at this, convert them once locally:

```bash
cd website/media
for f in a0*.png a1[01].png; do cwebp -q 82 "$f" -o "${f%.png}.webp"; done
```

Then point the `<img src>` and `url(...)` references at the `.webp` files (or ask me to rewrite them). The seven icon masks `a12`–`a18` are already small. Leaving the PNGs as they are works, it is just a slow first load.

## Still unfinished

Placeholder `#` links remain for About, Nobleman Sailing Media, Drone, and two of the service pages.
