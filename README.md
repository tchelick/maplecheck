# MapleCheck website

Static site, no backend, no build step. Five files do the work:
`index.html`, `companies.html`, `contact.html`, `privacy.html`, `style.css`,
`script.js`, and `extension-data.js`.

## Important: extension-data.js must stay in sync

`extension-data.js` in this folder is a **copy** of `data.js` from the
extension project. The companies directory page reads directly from it.
There is no automation keeping these in sync — every time you update the
extension's `data.js` (new companies, corrections, resolved "verify"
flags), copy it here too:

```
cp /path/to/maplecheck-extension/data.js /path/to/maplecheck-site/extension-data.js
```

If you forget this step, the website will show stale data even after the
extension itself is updated and republished.

## Before publishing

- [ ] Fill in the actual date on `privacy.html` (currently a placeholder —
      search for "[DATE" in that file)
- [ ] Replace the "Add to Chrome — free" button's `href="#"` on the
      homepage with the real Chrome Web Store listing URL once the
      extension is approved and live
- [ ] Sync `extension-data.js` one more time right before publishing, so
      the counts on the homepage (160 companies, 80 Canadian, etc.) match
      what's actually live — those numbers are hand-written in
      `index.html`, not calculated automatically, so update them too if
      the dataset has grown since this was written

## Deploying to maplecheck.store (registered at Hover)

This is a static site — no server-side code, so any static host works.
Two realistic free/cheap paths, since Hover itself doesn't include free
web hosting any more than it includes free email:

**Option A — Cloudflare Pages (free)**
1. Create a free Cloudflare account, add `maplecheck.store` as a site
2. Point Hover's nameservers at the ones Cloudflare gives you (same kind
   of DNS change discussed for the email forwarding setup)
3. Use Cloudflare Pages to deploy this folder as a static site — drag-and-
   drop upload works, no git required for a simple case like this
4. Cloudflare Pages gives you free HTTPS automatically

**Option B — GitHub Pages (free)**
1. Push this folder to a GitHub repository
2. Enable GitHub Pages for that repo (Settings → Pages)
3. Point a CNAME record at Hover's DNS settings to GitHub's Pages host,
   following GitHub's custom-domain instructions

Either works fine for a static site with no backend. Cloudflare Pages is
usually the simpler one to actually stick with long-term if you ever add
Cloudflare Email Routing too (mentioned earlier for the report inbox) —
it puts DNS, email, and hosting in one dashboard instead of three.

## Local preview

No build step needed — just open `index.html` directly in a browser, or
run a simple local server from this folder if you want relative links to
behave exactly like they will in production:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
