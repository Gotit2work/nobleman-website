# Moving to noblemanproductions.com

**Purpose.** Move the website from `noblemanproductions.gotit2work.com` to `noblemanproductions.com`, and the client portal from `portal.noblemanproductions.gotit2work.com` to `portal.noblemanproductions.com`, without breaking a link, an email, a payment, or the studio's Gmail.

**Scope.** Both Vercel projects (`nobleman-website`, `nobleman-portal`), the DNS for `noblemanproductions.com` at GoDaddy, the code's addresses (one script), and the outside services that remember an address (Stripe, Adobe, Vimeo, Google). It does not change `gotit2work.com` or its DNS.

**Who.** Alexis does the steps. Jean or Justin give access to the GoDaddy account that holds `noblemanproductions.com` and agree to retire the current site (step 0).

**Time.** About 45 minutes of work, plus waiting for DNS (usually minutes, at most a few hours).

## The rule that makes it safe

Every old address keeps working the whole time, so **nothing breaks if a step is late, skipped, or done out of order**:

- The old website address forwards to the new one (step 6), page for page.
- The old portal address keeps answering. Once the new one works, the portal sends visitors on to it, same page, by itself. It checks first that the new address answers, so a half-finished move never strands anyone.
- Stripe and Adobe can keep using the old portal address until you update them (step 8).
- The portal won't let anyone switch it to an address that doesn't answer yet.

## What's there today (checked 2026-10-02)

| Record at GoDaddy (`noblemanproductions.com`) | Today | Leave alone? |
|---|---|---|
| `A` `@` | `185.158.133.1`: the current site, hosted on Lovable | **Changes** in step 2 |
| `A` `www` | `185.158.133.1` (Lovable) | **Changes** in step 2 |
| `MX` `@` | `aspmx.l.google.com` and four `alt…` servers: the studio's Gmail (Google Workspace) | **Never touch** |
| `TXT` `@` | `google-site-verification=…` | **Never touch** |
| `TXT` `send` | `v=spf1 include:…_spfm.send.noblemanproductions.com ~all`: an earlier email sending setup | **Never touch** |
| `portal` | doesn't exist | **Added** in step 2 |

The nameservers are GoDaddy's (`ns75` and `ns76.domaincontrol.com`).

## Before you start

- [ ] **Step 0: agree with Jean and Justin to retire the current site.** The current site at noblemanproductions.com (on Lovable) stops showing at step 2. It isn't deleted, and step R puts it back in minutes if needed.
- [ ] You can log in to the GoDaddy account with `noblemanproductions.com`, to Vercel (team Gotit2Work), and, once the portal is live, to the portal as an owner.
- [ ] 📸 **Screenshot the GoDaddy DNS table for `noblemanproductions.com` before changing anything.** It's your way back.
- [ ] The site has run on its current address without problems, and Vercel is on Pro, since the site is commercial.

---

## Step 1. Add the new addresses in Vercel

1. Vercel → **nobleman-website** → **Settings → Domains → Add** → type `noblemanproductions.com` → when Vercel offers it, choose **Add www.noblemanproductions.com and redirect it to noblemanproductions.com** → **Add**.
2. Vercel → **nobleman-portal** → **Settings → Domains → Add** → `portal.noblemanproductions.com` → **Add**.
3. **Don't remove** the old domains from either project.

*Expected:* three new domains, each marked **Invalid Configuration**, each showing the record it wants (an `A` value for `noblemanproductions.com`; `CNAME` values for `www` and `portal`). Keep this page open; you need those exact values next.

## Step 2. Point the domain at Vercel (GoDaddy)

GoDaddy → **My Products** → `noblemanproductions.com` → **DNS**:

| Do | Type | Name | Value |
|---|---|---|---|
| **Edit** | `A` | `@` | The `A` value Vercel shows for `noblemanproductions.com` (replaces `185.158.133.1`) |
| **Delete** | `A` | `www` | (the Lovable `185.158.133.1`) |
| **Add** | `CNAME` | `www` | The `CNAME` value Vercel shows for `www.noblemanproductions.com` |
| **Add** | `CNAME` | `portal` | The `CNAME` value Vercel shows for `portal.noblemanproductions.com` |

- Use the values Vercel shows, exactly. They may differ from what's printed in guides.
- Type the Name exactly as shown (`@`, `www`, `portal`); GoDaddy adds `.noblemanproductions.com` itself.
- If there's more than one `A` record for `@`, delete the others, so only Vercel's is left.
- If GoDaddy shows **Forwarding** for the domain, remove it; forwarding overrides these records.
- If Vercel also asks for a `TXT` record named `_vercel`, add it exactly as shown.
- **Don't touch** `MX`, the `google-site-verification` `TXT`, or anything named `send` or `_domainkey`. Those carry the studio's email.

*Validation* (any computer; answers can take a few minutes):

```bash
nslookup noblemanproductions.com 1.1.1.1                    # the A value from Vercel
nslookup -type=CNAME www.noblemanproductions.com 1.1.1.1    # the www CNAME value
nslookup -type=CNAME portal.noblemanproductions.com 1.1.1.1 # the portal CNAME value
nslookup -type=MX noblemanproductions.com 1.1.1.1           # still aspmx.l.google.com and the alt servers
```

*Expected:* in Vercel, all three domains turn **Valid Configuration** and get a certificate, usually within minutes (up to an hour). 📸 *Screenshot GoDaddy's DNS table after saving, and Vercel's Domains page showing Valid.*

## Step 3. Check that the new addresses work

Open each one in a private window:

- [ ] `https://noblemanproductions.com`: the new site, with a padlock. The hero video plays (if it shows only a still, see Vimeo in step 8).
- [ ] `https://www.noblemanproductions.com`: forwards to `https://noblemanproductions.com`.
- [ ] `https://noblemanproductions.com/contact`: forwards to Start a project (old pages from the Lovable site forward too: `/quote`, `/work-samples`, `/voice-samples`).
- [ ] `https://portal.noblemanproductions.com`: the portal (the login, or the sample before go-live).
- [ ] Send an email to Jean or Justin at their `@noblemanproductions.com` address: it arrives, so email is untouched.

*Expected:* all of the above. The old addresses still show the site and the portal, as before.

## Step 4. Tell Vimeo about the new address (only if it asks)

Only if the hero video showed just a still in step 3: vimeo.com (Jean's account) → video `1197058424` → **Settings → Privacy → Where can this be embedded?** → under **Specific domains**, add `noblemanproductions.com` (keep the others), or choose **Anywhere**. Do the same for client videos if a client's video doesn't play in the portal: add `portal.noblemanproductions.com`.

## Step 5. Change the addresses in the code (one command per repository)

The site and the portal mention their own address in about 90 places: page headers, the site map for Google, the Log in links, and defaults. One script changes them all, and checks it missed none.

In each repository (`nobleman-website`, then `nobleman-portal`), on an up-to-date `main`:

```bash
node scripts/move-domain.mjs           # lists every line it would change; changes nothing
node scripts/move-domain.mjs --apply   # changes them, then checks none were missed
git diff                               # look it over
git commit -am "Move to noblemanproductions.com" && git push
```

*Expected:* the script ends with `Done: … now say noblemanproductions.com`, and Vercel deploys each push to production in about a minute. In the portal repository, `cd tests && npm test` passes too (it was run on a moved copy before this guide was written: 309 API and 141 browser checks).

Then rebuild the client welcome PDF, whose printed link and QR code now point at the new address (the script changed `welcome.html`, not the PDF):

```bash
cd docs/welcome && npm install && node build.mjs   # in nobleman-website
git add Nobleman-Welcome.pdf && git commit -m "Welcome PDF: new address" && git push
```

No terminal? Ask Claude: "Run step 5 of docs/MOVE.md in nobleman-website and nobleman-portal."

*Check:* on `https://noblemanproductions.com`, **Log in** opens `https://portal.noblemanproductions.com/signin`, and `https://noblemanproductions.com/sitemap.xml` lists only `noblemanproductions.com` pages.

## Step 6. Forward the old website address

Vercel → **nobleman-website** → **Settings → Domains** → `noblemanproductions.gotit2work.com` → **Edit** → **Redirect to** `noblemanproductions.com` → **308 Permanent** → **Save**.

*Expected:* `https://noblemanproductions.gotit2work.com/services` opens `https://noblemanproductions.com/services`.

**Don't do this for the portal's old address.** It must keep answering, because Stripe and Adobe call it. The portal sends visitors on by itself.

## Step 7. Confirm the portal's own address (portal live only)

Before go-live (the sample at the front door) there's nothing to do: step 5 changed it.

Once the portal is live: log in as an owner → **Studio → Settings → Studio details** → **Portal address**:

- If it already says `https://portal.noblemanproductions.com`, there's nothing to do.
- Otherwise, change it to `https://portal.noblemanproductions.com` → **Save**. The portal first checks that the address answers as this same portal. If it doesn't, nothing changes and the message says what to fix.
- Leave **Website** and **Privacy page** empty: they follow the portal's address.

Then **Settings → System check**. *Expected:* **Portal address** and **Website and privacy page** are both green. Open the old portal address: it moves you to the new one, same page. You log in once more, because logins belong to an address.

## Step 8. Update the outside services that remember the old address

The old address keeps working for all of these, so a late step does no harm. Do them now anyway.

| Service | Where | Change |
|---|---|---|
| **Stripe** (if connected) | Stripe → Developers → **Webhooks** → the portal's endpoint → edit its **endpoint URL** | `https://portal.noblemanproductions.com/api/connect?webhook=stripe`. Editing the URL keeps its signing secret, so nothing changes in the portal. Do it in test mode and in live mode if both exist. |
| **Adobe / Frame.io** (if connected) | Adobe Developer Console → the project → OAuth Web App credential → **Redirect URI** | **Add** `https://portal.noblemanproductions.com/api/connect` (keep the old one) → Save. Then Studio → Connections → Frame.io → **Sign in with Adobe** once, and switch **Live updates** off and on once so Frame.io's webhook calls the new address (the old one keeps answering either way). |
| **Notion** (if connected) | Studio → Connections → Notion → **Sync now** | The Portal links in the database change to the new address. |
| **Google Search Console** | search.google.com/search-console | Add the property `noblemanproductions.com` (it may already be verified by the existing `google-site-verification` record) → **Sitemaps** → submit `https://noblemanproductions.com/sitemap.xml`. |
| **Email signatures, social profiles, Google Business Profile** | each one | Change the website to `https://noblemanproductions.com`. |

*Check:* send a test event from the endpoint's page in Stripe: it answers `200`. Studio → System check → Payments is green.

## Step 9 (optional). Send portal email from noblemanproductions.com

The portal and the contact form send from `@gotit2work.com` today, which keeps working. To send from the studio's own domain:

1. Resend → **Domains**. `send.noblemanproductions.com` already has a sending record, so first check whether `noblemanproductions.com` is already listed (from an earlier setup). If not: **Add Domain** → `noblemanproductions.com`.
2. Add the records Resend lists at GoDaddy, exactly as shown. They go on `send` and `resend._domainkey`, never on `@` or `MX` for the root, so Gmail is unaffected. → **Verify**.
3. Portal: Studio → Connections → Email → **Change** → Send from `Nobleman Productions <portal@noblemanproductions.com>` → **Send a test email**.
4. Website contact form: Vercel → nobleman-website → Environment Variables → `INTAKE_FROM` = `Nobleman Productions <noreply@noblemanproductions.com>` → redeploy → send a test inquiry from `/start`.

A separate improvement, worth doing with whoever runs their Google Workspace: `noblemanproductions.com` has no SPF or DMARC record for its Gmail. Google's own SPF (`v=spf1 include:_spf.google.com ~all`, merged with any sending service you add) and a `_dmarc` record with `p=none` make their email less likely to land in spam.

## Step 10. Retire the old site (a week later)

Once the new site has run a week without problems: in Lovable, unpublish the old site or disconnect its domain. Keep the project, in case you ever need to look at it.

---

## Done when

- [ ] `noblemanproductions.com`, `www.` and `portal.` all show a padlock and the right page.
- [ ] The old website address forwards to the new one, page for page; the old portal address moves visitors to the new one.
- [ ] Email to and from `@noblemanproductions.com` works as before.
- [ ] Both repositories' scripts report `nothing names noblemanproductions.gotit2work.com any more`.
- [ ] `docs/welcome/Nobleman-Welcome.pdf` is rebuilt: its QR code opens `https://noblemanproductions.com/start`. Throw away printed copies with the old address.
- [ ] Portal System check is all green (portal live only).
- [ ] Stripe's webhook test returns 200 (if connected).
- [ ] 📸 Screenshots: GoDaddy DNS before and after, Vercel Domains showing Valid, the System check.

## If something goes wrong

| What you see | What to do |
|---|---|
| Vercel says **Invalid Configuration** after an hour | Compare GoDaddy's records with Vercel's, character by character. Delete extra `A` records for `@`. Remove GoDaddy **Forwarding**. |
| Browser warns about the certificate | The certificate is still being issued. Wait up to an hour; Vercel shows when it's ready. |
| The old Lovable site still shows | DNS caches. Wait an hour, or try a phone on mobile data. |
| **Email stopped arriving** at @noblemanproductions.com | An `MX` record was changed. Put back exactly what the "before" screenshot shows (`aspmx.l.google.com` priority 1, and the `alt` servers). |
| The hero video shows only a still | Vimeo's embed list doesn't include the new address (step 4). |
| The portal won't save the new Portal address | It doesn't answer yet as this portal. Check step 1 (domain added to **nobleman-portal**, not the website) and step 2 (the `portal` CNAME). |
| Payments stay "Due" after paying | Stripe's webhook points somewhere that doesn't answer: check step 8's URL. (The daily job also catches it within a day.) |
| `move-domain.mjs` says "Not finished" | It names the lines it missed. Change them by hand, or ask Claude, then run it again. |

## Step R. Rollback

Nothing in this move deletes anything, so each step undoes on its own:

- **Website back to the old site:** GoDaddy → `noblemanproductions.com` → `A` `@` back to `185.158.133.1`, `www` back to an `A` record `185.158.133.1` (as in your "before" screenshot). Vercel → nobleman-website → the old domain → **Edit** → remove the redirect.
- **Portal back to the old address:** Studio → Settings → Studio details → Portal address → `https://portal.noblemanproductions.gotit2work.com` → Save. It answers, so it saves.
- **Code:** `git revert` the "Move to noblemanproductions.com" commit in each repository and push. Both addresses work either way.
