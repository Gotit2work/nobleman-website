# Deployment runbook — Nobleman website and client portal

**Purpose.** Take both repositories from GitHub to live, working sites on Vercel:

| Site | Repository | Domain |
|---|---|---|
| Marketing website | `Gotit2work/nobleman-website` | `noblemanproductions.gotit2work.com` |
| Client portal | `Gotit2work/nobleman-portal` | `portal.noblemanproductions.gotit2work.com` |

**Scope.** Vercel projects, environment variables, the portal database, DNS at GoDaddy, email sending through Resend, and the first portal admin. It does not cover building the portal's project/review features (see "Known limits" at the end).

**Owner.** Alexis does every step. Nothing here needs Jean or Justin until their portal accounts are created in Phase 6.

**Time.** About 60–90 minutes of work, plus up to an hour of waiting for DNS and email verification.

---

## Facts this runbook relies on (checked 2026-09-30)

| Item | Value |
|---|---|
| Domain owner | Alexis owns `gotit2work.com` |
| DNS host | GoDaddy (nameservers `ns17/ns18.domaincontrol.com`) |
| `gotit2work.com` apex | A record → `185.158.133.1` (Lovable). **Do not change.** |
| Company email | Microsoft 365: MX `gotit2work-com.mail.protection.outlook.com`, SPF `v=spf1 include:spf.protection.outlook.com -all`, DMARC `p=none`. **Do not change.** |
| Subdomain records | None existed for `noblemanproductions` or `portal.noblemanproductions` |
| Vercel account | `amangual1`, team `gotit2-work`, **Hobby** plan |
| Hero video | Vimeo `1197058424` (hash `796798a19d`), owner account is Vimeo Plus, embeddable |

> **Vercel plan.** Vercel's fair-use guidelines say: *"Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan."* Decision on 2026-09-30: stay on Hobby while the site is a pre-launch preview and the portal runs as a demo. Upgrade the `gotit2-work` team to Pro before the site is marketed or real clients use the portal. Check current pricing on vercel.com/pricing.

---

## Prerequisites

- [ ] Vercel team `gotit2-work` on the Pro plan (or trial).
- [ ] The Vercel GitHub app can see both repositories (vercel.com → Team Settings → Git → GitHub → Configure).
- [ ] GoDaddy login with DNS access to `gotit2work.com`.
- [ ] A Resend account (resend.com). Free tier is enough to start.
- [ ] A terminal with `curl` and `openssl` (macOS/Linux; on Windows use WSL or Git Bash).
- [ ] The fix branch `claude/awesome-euler-ynmcfs` merged into `main` in **both** repositories (Phase 0).

Generate two secrets now and keep them in your password manager:

```bash
openssl rand -base64 48   # SESSION_SECRET  (portal, permanent)
openssl rand -base64 32   # BOOTSTRAP_SECRET (portal, one-time)
```

---

## Phase 0 — Merge the fixes

In each repository on GitHub: open a pull request from `claude/awesome-euler-ynmcfs` into `main`, review, and merge.

*Why:* Vercel deploys `main` to production. Until the merge, only preview deployments contain the fixes.

*Optional safer path:* connect the projects first (Phases 1–2). Vercel builds a preview for the branch automatically, so you can click through the preview URL before merging.

---

## Phase 1 — Website project on Vercel

1. vercel.com → team switcher (top left) → **gotit2-work** → **Add New… → Project**.
2. **Import Git Repository** → `Gotit2work/nobleman-website` → **Import**.
3. Configure:
   - Project Name: `nobleman-website`
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build and Output Settings: leave every override **off** (no build command, no output directory). Vercel serves the repo root and builds `api/intake.js` as a function.
4. **Environment Variables** (add now; Phase 5 fills in the Resend key):

   | Name | Value | Environments |
   |---|---|---|
   | `RESEND_API_KEY` | from Resend (Phase 5) | Production, Preview |
   | `INTAKE_TO` | `alexis@gotit2work.com` (optional, this is the default) | Production, Preview |
   | `INTAKE_FROM` | `Nobleman Productions <noreply@gotit2work.com>` (optional, default) | Production, Preview |

5. **Deploy.** Expected: build finishes in under a minute, status **Ready**, and a `*.vercel.app` URL that shows the site.
6. **Settings → Domains → Add** → `noblemanproductions.gotit2work.com` → **Add**. Vercel shows *Invalid Configuration* and the CNAME value it wants. **Copy that exact value** (it looks like `cname.vercel-dns.com` or a project-specific `…vercel-dns-0xx.com`).

📸 *Screenshot the project's General settings (Framework "Other") and the Domains page with the CNAME value.*

---

## Phase 2 — Portal project and database

1. **Add New… → Project** → import `Gotit2work/nobleman-portal`. Same settings as Phase 1 (Framework **Other**, no overrides). Deploy. (Sign-in will fail until steps 2–5 are done; that is expected.)
2. Portal project → **Storage → Create Database → Neon** (Vercel Marketplace). Region: **Washington, D.C. (iad1)**, which matches Vercel's default function region so every query stays in-region. Connect it to the portal project for **Production, Preview, and Development**. Vercel sets `DATABASE_URL` automatically.
   *Tradeoff:* previews then share the production database. That is fine while the portal holds only logins; revisit once real client data exists (Neon can branch a database per preview).
3. **Create the tables.** Storage → your database → **Open in Neon** → **SQL Editor** → paste all of `schema.sql` from the portal repo → **Run**. Expected: a run of `CREATE TABLE` / `CREATE INDEX` with no errors. The file is idempotent; re-running it after future updates is safe.
4. **Environment Variables** on the portal project:

   | Name | Value | Environments |
   |---|---|---|
   | `SESSION_SECRET` | the 48-byte value you generated | Production, Preview |
   | `BOOTSTRAP_SECRET` | the one-time value | Production only |
   | `PORTAL_MODE` | `demo` while the portal is a public showcase; delete it to require sign-in | Production, Preview |

5. **Redeploy** so the variables take effect: Deployments → newest → ⋯ → **Redeploy**. Environment variables only apply to deployments created after they were set.
6. **Settings → Domains → Add** → `portal.noblemanproductions.gotit2work.com`. Copy the CNAME value Vercel shows.

📸 *Screenshot Storage showing Neon connected, and Environment Variables (names only; keep values hidden).*

---

## Phase 3 — DNS at GoDaddy

GoDaddy → **My Products** → `gotit2work.com` → **DNS** → **Add New Record**:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `noblemanproductions` | value from Phase 1 step 6 | 1 hour |
| CNAME | `portal.noblemanproductions` | value from Phase 2 step 6 | 1 hour |

- Type the Name exactly as shown. GoDaddy appends `.gotit2work.com` itself, so entering the full name produces `noblemanproductions.gotit2work.com.gotit2work.com`.
- If Vercel also asks for a `TXT` record named `_vercel` (it does when the domain was ever used in another Vercel account), add it exactly as shown.
- **Do not edit** the `@` A record, MX, the SPF TXT, the `MS=` TXT, or `_dmarc`.

**Validation**

```bash
nslookup -type=CNAME noblemanproductions.gotit2work.com 1.1.1.1
nslookup -type=CNAME portal.noblemanproductions.gotit2work.com 1.1.1.1
```

Expected: each answers with the Vercel value. In Vercel, both domains flip to **Valid Configuration** and a certificate is issued automatically, usually within minutes (up to an hour).

📸 *Screenshot the GoDaddy DNS table after saving and Vercel's Domains page showing Valid.*

---

## Phase 4 — Check the hero video's Vimeo settings

vimeo.com (Jean's account, `jeangotay`) → video `1197058424` → **Settings → Privacy → Where can this be embedded?** It must be **Anywhere**, or **Specific domains** including both `noblemanproductions.gotit2work.com` and `*.vercel.app` (for previews). If it is restricted and the domain is missing, the hero shows its poster frame and the video never starts.

---

## Phase 5 — Email for the contact form (Resend)

1. resend.com → **Domains → Add Domain** → `gotit2work.com` → region **us-east-1** → Add.
2. Resend lists three records. Add each at GoDaddy exactly as shown. They will look like:

   | Type | Name | Value |
   |---|---|---|
   | MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
   | TXT | `send` | `v=spf1 include:amazonses.com ~all` |
   | TXT | `resend._domainkey` | the long DKIM key Resend shows |

   **Do not add Amazon SES to the root SPF record.** Resend sends as `send.gotit2work.com`, which gets its own SPF, and signs with DKIM on `gotit2work.com`, which is what DMARC checks. Your Microsoft 365 SPF stays exactly as it is.
3. Back in Resend → **Verify DNS Records**. Wait for **Verified**.
4. Resend → **API Keys → Create API Key** → permission *Sending access*, domain `gotit2work.com` → copy the key (shown once).
5. Vercel → website project → Environment Variables → set `RESEND_API_KEY` → **Redeploy**.

**Validation:** submit the form at `/start` with your own personal email. Expected within a minute: "Inquiry — *name*" at `alexis@gotit2work.com` (hitting Reply addresses the visitor), and "We received your inquiry" at the address you entered. Check spam the first time.

---

## Phase 6 — First portal admin

```bash
curl -sS -X POST https://portal.noblemanproductions.gotit2work.com/api/bootstrap \
  -H 'content-type: application/json' \
  -d '{"secret":"<BOOTSTRAP_SECRET>","name":"Alexis","email":"alexis@gotit2work.com","password":"<12+ characters>"}'
```

Expected: HTTP 201 with your user. A second run answers 409 ("An admin already exists").
Then delete `BOOTSTRAP_SECRET` from the portal's environment variables and redeploy. The endpoint is harmless once an admin exists, but a removed secret can't leak.

Create Jean and Justin with the admin API; the commands are in the portal README.

---

## Completion criteria

**Website**
- [ ] `https://noblemanproductions.gotit2work.com` loads with a valid padlock.
- [ ] The hero shows the harbor frame immediately and the reel starts playing within a few seconds.
- [ ] Nav and footer appear on `/`, `/work`, `/services`, `/live-production`, `/conference-event`, `/about`, `/privacy`, `/start`; a film on `/work` opens in the full-screen player and plays.
- [ ] The contact form delivers both emails (Phase 5 validation).
- [ ] `/anything-random` shows the branded 404 page.
- [ ] Sharing the link in iMessage/Slack shows the Nobleman preview card.

**Portal**
- [ ] `https://portal.noblemanproductions.gotit2work.com` shows the sign-in screen.
- [ ] A wrong password shows "That email and password do not match."
- [ ] The right password opens the portal greeting you by name; a reload keeps you signed in; Sign out works.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Vercel domain stuck on *Invalid Configuration* | DNS not propagated; Name doubled (`…gotit2work.com.gotit2work.com`); value typo | Re-check the GoDaddy record; wait up to an hour; `nslookup` against `1.1.1.1` |
| Page loads but no nav/footer | `SiteChrome.dc.html` / `SiteFooter.dc.html` missing from the deploy | Browser console shows `[dc-runtime] sibling fetch … failed`; confirm both files are at the repo root on `main` |
| Hero shows the still frame and never plays | Vimeo embed restrictions (Phase 4), or the viewer's device blocks autoplay (e.g. iOS Low Power Mode) | Fix the Vimeo setting; device-side autoplay blocks are expected and the poster is the intended fallback |
| Form says "Online inquiries aren't switched on yet…" | `RESEND_API_KEY` missing, or set without a redeploy | Set it, then redeploy |
| Form says "We could not send that…" | Resend domain not verified, or `INTAKE_FROM` uses a domain Resend hasn't verified | Vercel → website → Logs → filter `/api/intake` → look for `intake failed` |
| Portal: "Sign-in is unavailable right now" | `DATABASE_URL` missing, `schema.sql` not run, or `SESSION_SECRET` shorter than 32 characters | Vercel → portal → Logs → `/api/login` |
| Portal: "The portal is having trouble…" on load | `/api/me` failing for the same reasons | Same as above |
| Portal: "Too many attempts. Wait 15 minutes…" | 8 failed sign-ins for that email (or 30 from one IP) within 15 minutes | Wait, or in Neon SQL Editor: `delete from login_attempts where email = 'person@example.com';` |
| Logs show `login throttle unavailable` | `login_attempts` table missing | Re-run `schema.sql` (safe) |

---

## Rollback

| What | How | Effect |
|---|---|---|
| A bad deploy | Vercel → project → Deployments → last good one → ⋯ → **Promote to Production** | Instant; no rebuild |
| Code | Revert the merge commit on `main` | Vercel redeploys the previous code |
| Take the sites offline | Delete the two CNAME records at GoDaddy | Subdomains stop resolving; the apex site and email are untouched |
| Email sending | Delete the Resend records or revoke the API key | Only the contact form stops sending |

---

## Known limits after this runbook

- **The portal is a real login in front of a prototype.** Sign-in, roles, and account management are real. The projects, versions, review comments, files, and messages every user sees are hardcoded sample data (the "Meridian" campaign). Don't give clients logins until projects are stored per client.
- **No admin screens yet.** Accounts are created with `curl` (portal README).
- **Open content decisions on the website.** The privacy policy needs an owner review; there is no Terms page or Instagram link; the inquiry address (alexis@gotit2work.com) differs from noblemanproductions.com (info@noblemanproductions.com); much of the copy duplicates noblemanproductions.com. See the README, "Still unfinished".
- **The hero plays "RETROBOAT S2 EP1", a 22-minute episode.** A dedicated 15–30 second reel would make a better background loop and use less of visitors' data.
