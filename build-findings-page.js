// build-findings-page.js
//
//   node build-findings-page.js
//
// Writes findings.html — the brands people believe are Canadian that are not.
//
// WHY A SEPARATE PAGE: nobody links to "a company ownership database", but
// people do link to "Roots has been controlled from Fifth Avenue for a
// decade". This is the page that can earn a share, and shares are what make
// the rest of the site findable at all.
//
// It is generated rather than written by hand so it cannot drift from the
// research. Which companies belong here is a judgement call — that lives in
// FEATURED below — but every factual claim on the page is pulled from
// data.js at build time. If an entry's ownership changes, this page changes
// with it, and if an entry disappears the build says so rather than shipping
// a stale claim.
//
// The tone matters more than usual here. The temptation with a page like this
// is outrage, and outrage is exactly what would discredit it. Every item says
// what happened and what the source was, and the Canadian half of each story
// is told too — most of these companies still employ Canadians and still make
// things here. "Foreign-owned" is a fact about where the profits go, not an
// accusation.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SITE = "https://www.maplecheck.store";

const src = fs.readFileSync(path.join(ROOT, "extension-data.js"), "utf8");
const DATA = new Function(`${src}\nreturn OWNERSHIP_DATA;`)();
const SLUGS = (() => {
  try {
    const s = fs.readFileSync(path.join(ROOT, "company-slugs.js"), "utf8");
    return new Function(`${s}\nreturn COMPANY_SLUGS;`)();
  } catch (e) {
    return {};
  }
})();

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---- the judgement ----
//
// Inclusion test: would a reasonable Canadian shopper be surprised? A Spanish
// company being Spanish is not a finding. A Guelph brewery founded in 1834
// being Japanese-owned is.
const SECTIONS = [
  {
    id: "pending",
    title: "Sold — but the deal hasn't closed yet",
    blurb:
      "These are still Canadian-owned today, in law. Each has agreed to be bought by a foreign company, and none of those deals has completed. We do not move the label until a sale legally closes, because deals do fall through — but you should know it is coming.",
    domains: ["roots.com", "jamiesonvitamins.com"],
  },
  {
    id: "founded-here",
    title: "Founded in Canada. Not Canadian-owned any more.",
    blurb:
      "Every one of these began here, and most still employ Canadians, design here, or brew and sew here. What changed is who receives the profit.",
    domains: [
      "arcteryx.com",
      "skipthedishes.com",
      "sleeman.ca",
      "labatt.com",
      "vanhoutte.com",
      "pof.com",
      "deciem.com",
      "lasenza.ca",
      "saxxunderwear.com",
      "frankandoak.com",
      "kickinghorsecoffee.com",
      "mackage.com",
      "fourseasons.com",
      "fairmont.com",
      "royaldistributing.com",
    ],
  },
  {
    id: "canadian-branding",
    title: "Canadian branding, foreign owner",
    blurb:
      "Marketing that leans on a Canadian identity the ownership no longer supports. This is the group worth knowing about, because the branding is doing the opposite of informing you.",
    domains: ["rona.ca", "canadadry.com", "nationalpost.com"],
  },
];

// A page that only lists disappointments is a page people distrust. These are
// the ones that hold up — and they are the answer to "so what do I buy?"
const STILL_CANADIAN = [
  "canadagoose.com",
  "aritzia.com",
  "mec.ca",
  "herschel.com",
  "saje.com",
  "miik.ca",
  "tilley.com",
  "lanaknits.com",
  "canadiandownandfeather.com",
  "urbanbarn.com",
  "hu-ha.com",
];

function entry(domain) {
  const e = DATA[domain];
  if (!e) {
    console.warn(`  ! ${domain} is no longer in the dataset — skipped`);
    return null;
  }
  return { domain, ...e, slug: SLUGS[domain] };
}

function ownerLabel(e) {
  if (e.changingTo) return `Being sold — becoming ${e.changingTo}`;
  if (e.ownership === "US") return "US-owned";
  if (e.ownership === "not-US") return "Foreign-owned (not US)";
  if (e.ownership === "Canada" && e.controlledFrom) return `${e.controlledFrom}-controlled`;
  if (e.ownership === "Canada") return "Canadian-owned";
  return "No single answer";
}

function itemHtml(e) {
  const link = e.slug ? `company/${e.slug}` : "companies";
  return `      <li class="finding">
        <h3><a href="${link}">${esc(e.brand)}</a></h3>
        <p class="finding-label">${esc(ownerLabel(e))}${e.hq ? ` &middot; ${esc(e.hq)}` : ""}</p>
        <p class="finding-note">${esc(e.note || "")}</p>
      </li>`;
}

// ---- build ----

const built = [];
for (const s of SECTIONS) {
  const items = s.domains.map(entry).filter(Boolean);
  built.push({ ...s, items });
}

const stillCanadian = STILL_CANADIAN.map(entry)
  .filter(Boolean)
  // Guard against listing a company as reassuring when the dataset says
  // otherwise. This caught Roots, which was Canadian when this list was
  // written and is not now.
  .filter((e) => e.ownership === "Canada" && !e.changingTo && !e.controlledFrom);

const total = built.reduce((n, s) => n + s.items.length, 0);

const title = "Canadian brands that aren't Canadian-owned — MapleCheck";
const desc =
  "Brands most Canadians assume are Canadian, and who actually owns them now — with the filing, deal record or company statement behind each one.";
const url = `${SITE}/findings`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="impact-site-verification" value="d22a4344-9bc9-45a6-9522-229f39cf68c3" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="MapleCheck" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}/mascot.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${SITE}/mascot.png" />
<link rel="icon" type="image/png" href="favicon.png" />
<link rel="stylesheet" href="style.css" />
</head>
<body>

<nav class="site-nav">
  <div class="wrap">
    <a href="index.html" class="nav-brand"><img src="logo.png" alt="" class="nav-logo" />MapleCheck</a>
    <div class="nav-links">
      <a href="index.html">Home</a>
      <a href="companies.html">Companies</a>
      <a href="findings.html" class="active">Findings</a>
      <a href="contact.html">Add a company</a>
      <a href="feedback.html">Feedback</a>
      <a href="privacy.html">Privacy</a>
    </div>
  </div>
</nav>

<section class="section">
  <div class="wrap findings-page">
    <div class="findings-hero">
      <div class="findings-hero-text">
    <h1>Canadian brands that aren't Canadian-owned</h1>
    <p class="section-lede">
      A brand can be founded here, headquartered here, staffed by Canadians and
      making things in Canadian factories, and still send its profits somewhere
      else. That is not a scandal — companies get bought — but it is usually
      invisible at the point where you are deciding what to buy, and the
      marketing rarely volunteers it.
    </p>
    <p class="section-lede">
      These ${total} are the ones most likely to surprise you. Every claim below
      comes from a regulatory filing, a corporate registry, an acquisition
      record, or the company's own statement, and every entry links to the
      sources we used. Where we are not certain, we say so rather than guess.
    </p>
      </div>
      <picture class="findings-hero-art">
        <source srcset="mascot.webp" type="image/webp" />
        <img src="mascot.png" width="1120" height="1000" alt="The MapleCheck maple leaf looking thoughtfully at a laptop, beside books labelled Research, Compare, Support Canadian and a checklist reading Check, Compare, Choose Canadian." />
      </picture>
    </div>
`;

const parts = [html];

for (const s of built) {
  parts.push(`    <h2 id="${s.id}">${esc(s.title)}</h2>
    <p class="findings-blurb">${esc(s.blurb)}</p>
    <ul class="findings-list">
${s.items.map(itemHtml).join("\n")}
    </ul>
`);
}

if (stillCanadian.length) {
  parts.push(`    <h2 id="still-canadian">And plenty that genuinely are Canadian</h2>
    <p class="findings-blurb">Because the point is not that everything is a disappointment. These hold up — and where a Canadian option genuinely exists, the directory names it.</p>
    <ul class="findings-list still-canadian">
${stillCanadian.map(itemHtml).join("\n")}
    </ul>
`);
}

parts.push(`    <h2>How this was checked</h2>
    <p>Public filings and exchange listings first (SEDAR+, SEC EDGAR), then
    corporate registries, then acquisition and deal records, then the company's
    own public statements. Ownership, where things are manufactured, and where
    materials come from are tracked as three separate questions, because
    conflating them is how "Canadian" ends up meaning nothing. Entries we could
    not confirm are labelled as still being verified rather than quietly
    guessed at.</p>
    <p>Ownership changes. If something here is out of date, or you know
    something we do not, <a href="contact.html">tell us</a> — corrections are
    how this stays worth reading.</p>

    <p class="findings-cta"><a href="companies.html">Browse all ${Object.keys(DATA).length} researched companies &rarr;</a></p>
  </div>
</section>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-meta">MapleCheck &middot; community-researched, not a government service</div>
    <div class="footer-links">
      <a href="companies.html">Companies</a>
      <a href="contact.html">Add a company</a>
      <a href="feedback.html">Feedback</a>
      <a href="privacy.html">Privacy</a>
    </div>
    <div class="footer-affiliate">Some links on this site are affiliate links. If you make a purchase through them, MapleCheck may earn a small commission at no extra cost to you. This never influences which companies we list as Canadian-owned or how we describe them.</div>
  </div>
</footer>

</body>
</html>
`);

fs.writeFileSync(path.join(ROOT, "findings.html"), parts.join("\n"));
console.log(`findings.html : ${total} findings across ${built.length} sections, plus ${stillCanadian.length} still-Canadian`);
