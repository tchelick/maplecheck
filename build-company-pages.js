// build-company-pages.js
//
//   node build-company-pages.js
//
// Writes one static HTML page per company into company/, plus sitemap.xml.
//
// WHY THIS EXISTS: companies.html renders the directory from JavaScript, so a
// search engine fetching it sees an empty shell — all 410 companies were
// invisible to Google. That is the whole product being unfindable by the
// people most likely to want it, because "is <brand> Canadian owned" is
// exactly what someone types before buying.
//
// These pages are plain HTML with the answer in the title, the heading and
// the meta description, so they can rank without JavaScript running at all.
// The interactive directory stays as it is; this is additive.
//
// Run by sync-data.sh on every publish, so the pages can never drift from
// data.js. Regenerating is cheap — the whole directory is rewritten each time
// rather than diffed, which avoids stale pages for removed companies.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "company");
const SITE = "https://www.maplecheck.store";

const src = fs.readFileSync(path.join(ROOT, "extension-data.js"), "utf8");
const DATA = new Function(`${src}\nreturn OWNERSHIP_DATA;`)();

// ---- helpers ----

// Everything from the dataset goes through this before reaching the page.
// The data is ours, but these are static files served to the public and one
// unescaped quote in a note would break the markup around it.
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

function safeUrl(raw, { sponsored = false } = {}) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (!DOMAIN_RE.test(u.hostname)) return null;
    return { href: u.href, host: u.hostname, sponsored };
  } catch (e) {
    return null;
  }
}

// The one-line answer, written the way someone would say it out loud. This
// becomes the <title> and the meta description, so it is what shows up in a
// search result — it has to answer the question there, not tease it.
function verdict(e) {
  if (e.ownership === "Canada") return "Canadian-owned";
  if (e.ownership === "US") return "US-owned";
  if (e.ownership === "not-US") return "Not Canadian, but not US-owned either";
  // ownership: "verify" means no flag is assigned, because naming one country
  // would misinform — mixed structures, unfinished sales. It is a deliberate
  // answer, not a gap, and the page should not imply nobody looked.
  return "No single answer";
}

// A sentence that reads properly for each case. The meta description is the
// one line someone sees in a search result, and "Roots is ownership unclear"
// reads as a broken page rather than a careful finding.
function verdictSentence(e) {
  const b = e.brand;
  if (e.ownership === "Canada") return `${b} is Canadian-owned`;
  if (e.ownership === "US") return `${b} is US-owned`;
  if (e.ownership === "not-US") return `${b} is not Canadian, but it is not US-owned either`;
  return `${b}'s ownership has no single honest answer`;
}

function verdictClass(e) {
  if (e.ownership === "Canada") return "v-ca";
  if (e.ownership === "US") return "v-us";
  return "v-other";
}

const MADE_IN = {
  Canada: "Made in Canada",
  mixed: "Partly made in Canada",
  imported: "Made abroad",
};

// ---- page ----

function pageHtml(domain, e, slug) {
  const v = verdict(e);
  const title = `Is ${e.brand} Canadian-owned? — MapleCheck`;

  // Lead the description with the answer. A description that says "learn about
  // ownership" wastes the one line a searcher reads before deciding to click.
  let desc = verdictSentence(e);
  if (e.hq) desc += `, headquartered in ${e.hq}`;
  desc += ". ";
  if (e.changingTo) desc += `Sale agreed — becoming ${e.changingTo}. `;
  desc += "Researched from public filings and company statements, with sources.";
  desc = desc.slice(0, 300);

  const canonical = `${SITE}/company/${slug}`;

  const link =
    (e.affiliateUrl && safeUrl(e.affiliateUrl, { sponsored: true })) ||
    (e.storeUrl && safeUrl(e.storeUrl)) ||
    (DOMAIN_RE.test(domain) ? { href: `https://${domain}`, host: domain, sponsored: false } : null);

  const alts = [
    ...(e.alternatives || []).map((a) => ({ text: a, canadian: true })),
    ...(e.otherAlternatives || []).map((a) => ({ text: a, canadian: false })),
  ];

  const parts = [];
  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="impact-site-verification" value="d22a4344-9bc9-45a6-9522-229f39cf68c3" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="MapleCheck" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${SITE}/logo.png" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${SITE}/logo.png" />
<link rel="icon" type="image/png" href="../favicon.png" />
<link rel="stylesheet" href="../style.css" />
</head>
<body>

<nav class="site-nav">
  <div class="wrap">
    <a href="../index.html" class="nav-brand"><img src="../logo.png" alt="" class="nav-logo" />MapleCheck</a>
    <div class="nav-links">
      <a href="../index.html">Home</a>
      <a href="../companies.html">Companies</a>
      <a href="../contact.html">Add a company</a>
      <a href="../feedback.html">Feedback</a>
      <a href="../privacy.html">Privacy</a>
    </div>
  </div>
</nav>

<section class="section">
  <div class="wrap company-page">
    <p class="crumb"><a href="../companies.html">All companies</a> &rsaquo; ${esc(e.category || "Directory")}</p>
    <h1>Is ${esc(e.brand)} Canadian-owned?</h1>
    <p class="verdict ${verdictClass(e)}">${esc(v)}${e.hq ? ` &middot; ${esc(e.hq)}` : ""}</p>`);

  if (e.changingTo) {
    parts.push(`    <p class="alert-tag alert-changing">&#9888; Sale agreed — becoming ${esc(e.changingTo)}</p>`);
  }
  if (e.controlledFrom) {
    parts.push(`    <p class="alert-tag alert-control">&#9888; ${esc(e.controlledFrom)}-controlled</p>`);
  }
  if (e.confidence === "verify") {
    parts.push(`    <p class="verify-note">&#9888; Still being verified — see what we found below.</p>`);
  }

  if (e.note) {
    parts.push(`    <h2>What we found</h2>
    <p class="company-note-full">${esc(e.note)}</p>`);
  }

  // Ownership and manufacturing are different questions and the site says so
  // everywhere else; these pages have to keep that separation visible.
  if (e.madeIn || e.materialsFrom) {
    parts.push(`    <h2>Where the products come from</h2>
    <p class="made-detail">This is a separate question from who owns the company.</p>
    <ul class="made-list">`);
    if (e.madeIn) parts.push(`      <li><strong>Manufacturing:</strong> ${esc(MADE_IN[e.madeIn] || e.madeIn)}</li>`);
    if (e.materialsFrom) parts.push(`      <li><strong>Materials:</strong> ${esc(e.materialsFrom)}</li>`);
    parts.push(`    </ul>`);
  }

  if (alts.length) {
    parts.push(`    <h2>Canadian alternatives</h2>
    <ul class="alt-list-page">`);
    for (const a of alts) {
      parts.push(`      <li${a.canadian ? "" : ' class="alt-other"'}>${esc(a.text)}</li>`);
    }
    parts.push(`    </ul>`);
    if (e.alternativesNote) parts.push(`    <p class="alt-note">${esc(e.alternativesNote)}</p>`);
  }

  if (link) {
    const rel = link.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer";
    parts.push(`    <p class="company-visit">
      <a class="company-link" href="${esc(link.href)}" target="_blank" rel="${rel}">Visit ${esc(link.host)} &#8599;</a>${
        link.sponsored
          ? `<span class="affiliate-tag" title="MapleCheck may earn a commission on purchases through this link, at no extra cost to you. This has no bearing on our research.">Affiliate link</span>`
          : ""
      }
    </p>`);
  }

  parts.push(`    <p class="company-cta">Know something we don't? <a href="../contact.html">Tell us</a> — corrections are how this stays accurate.</p>
    <p class="company-cta"><a href="../companies.html">Browse all ${Object.keys(DATA).length} researched companies &rarr;</a></p>
  </div>
</section>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-meta">MapleCheck &middot; community-researched, not a government service</div>
    <div class="footer-links">
      <a href="../companies.html">Companies</a>
      <a href="../contact.html">Add a company</a>
      <a href="../feedback.html">Feedback</a>
      <a href="../privacy.html">Privacy</a>
    </div>
    <div class="footer-affiliate">Some links on this site are affiliate links. If you make a purchase through them, MapleCheck may earn a small commission at no extra cost to you. This never influences which companies we list as Canadian-owned or how we describe them.</div>
  </div>
</footer>

</body>
</html>`);

  return parts.join("\n");
}

// ---- run ----

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const used = new Map();
const written = [];

for (const [domain, e] of Object.entries(DATA)) {
  let slug = slugify(e.brand) || slugify(domain);
  // Two companies can legitimately share a name. Fall back to the domain so
  // one never silently overwrites the other.
  if (used.has(slug)) slug = `${slug}-${slugify(domain.replace(/\.[a-z.]+$/, ""))}`;
  if (used.has(slug)) slug = slugify(domain);
  used.set(slug, domain);

  fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), pageHtml(domain, e, slug));
  written.push({ slug, domain, brand: e.brand });
}

// sitemap: the static pages plus every company page
// Extensionless, to match the canonical tags on those pages. cleanUrls serves
// both /companies and /companies.html, so listing the .html form here would
// point Google at a URL that then declares a different canonical.
const staticPages = ["", "companies", "contact", "feedback", "privacy"];
const today = new Date().toISOString().slice(0, 10);
const urls = [
  ...staticPages.map((p) => `${SITE}/${p}`),
  ...written.map((w) => `${SITE}/company/${w.slug}`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
);

// The directory links to these pages, so it needs to know each company's slug.
// Emitting the real map rather than recomputing slugify() in the browser means
// a future name collision cannot produce links to pages that do not exist.
const slugMap = {};
for (const w of written) slugMap[w.domain] = w.slug;
fs.writeFileSync(
  path.join(ROOT, "company-slugs.js"),
  `// Generated by build-company-pages.js — do not edit.
const COMPANY_SLUGS = ${JSON.stringify(slugMap)};
`
);

console.log(`company pages : ${written.length} written to company/`);
console.log(`company-slugs : written`);
console.log(`sitemap.xml   : ${urls.length} URLs`);
console.log(`robots.txt    : written`);
