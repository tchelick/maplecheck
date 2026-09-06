# MapleCheck — to do

Working list. Note this file is in a public repo, so keep anything
commercially sensitive out of it.

## Blocking launch

- [ ] **Publish the extension.** Packages build clean (`node build.js` in the
      extension repo, 0 lint errors). Not yet submitted anywhere.
  - [ ] Chrome Web Store — $5 one-time developer registration
  - [ ] Microsoft Edge Add-ons (Partner Center) — free
  - [ ] Firefox / addons.mozilla.org — free
  - [ ] Opera Add-ons — free
  - Brave and Vivaldi users install from the Chrome store; no separate submission.
  - Store listings need: privacy policy URL (have it), screenshots and promo
    images (marquee/promo tile/screenshot files are already in Downloads).
- [ ] **Replace the homepage "Add to your browser" link** once the store URLs
      exist — currently `href="#"`, and the extension is presented as coming soon.
- [ ] **Decide on the Made-in-Canada review** before the extension goes public.
      `data.js` header states the never-flagged entries have not each been
      individually re-sourced. Fine for now, worth a lawyer's eye before scale.

## Data — companies still to resolve

Eight brands from the community list have no working domain yet.

- [ ] Frankie & Missy — Google link resolved only to a Poshmark resale page
- [ ] Wolfe Co. Apparel and Goods — resolved only to an Explore Huntsville listing
- [ ] Marallis — resolved only to a Shopping Channel brand page
- [ ] Michael Tyler — no link provided
- [ ] Message Factory — no link provided (Quebec, sustainable casual wear)
- [ ] Linda Legault — no link provided
- [ ] Kim Brash — no link provided
- [ ] Lasania — no link provided

Also outstanding:

- [ ] **Blondo** (`blondo.ca`) — Quebec heritage brand founded 1910. Signals
      suggest it may now sit under US-based Caleres; not confirmed either way.
- [ ] **Lolë**, **Northern Reflections**, **Tribal**, **Muttonhead** — ownership
      is confirmed (Lolë and Northern Reflections Canadian, Tribal US-owned via
      Haggar of Dallas, Muttonhead Toronto) but no verified domain yet.
- [ ] **Milk vs Miik** — never resolved which was meant. Miik (`miik.ca`,
      Toronto, made within 50km of their office) is the likely one; MILK Toronto
      is a sneaker boutique.

## Data — ongoing

- [ ] Work the 23 `confidence: "verify"` entries as submissions come in through
      the Tally form and the per-company "Help verify" buttons.
- [ ] Fill `madeIn` / `materialsFrom` for existing entries where the company
      states it publicly. Most entries have neither field yet.
- [ ] Periodic re-check pass — ownership changes. Petro-Canada, Well.ca and
      Rexall have each flipped within a decade.
- [ ] **Toys "R" Us Canada — recheck after 25 January 2027**, when Putman's
      licence to use the brand name expires.
- [ ] Spark Networks brands (Zoosk, Christian Mingle, JDate) — recheck when the
      German insolvency concludes and a buyer is named.

## Site

- [ ] Consider adding two questions to the Tally form: source type (filing /
      news / company statement / I work there) and where products are made.
      Both make triage faster and map onto fields the dataset already has.
- [ ] Affiliate links — the disclosure copy is live in the footer, on the
      directory page and in the extension, but no affiliate links exist yet.
      Wire up actual programs when ready.
- [ ] Custom 404 page.
- [ ] Consider a "recently added" or "recently changed ownership" view — the
      dataset now has enough churn to make that interesting.

## Housekeeping

- [ ] Git commits in the extension repo are authored as
      `Your Name <you@example.com>` from the placeholder global git config, and
      that is public on GitHub. Fix with:
      `git config --global user.name "..."` and `git config --global user.email "..."`
- [ ] Test the Firefox build in an actual Firefox install. It passes
      `web-ext lint` with 0 errors and the `chrome.*` namespace is documented as
      supported, but it has never been run in Firefox.
- [ ] Vercel still shows "DNS Change Recommended" — the apex A record is on
      Vercel's older IP (76.76.21.21). Works fine; clears the warning if updated.
