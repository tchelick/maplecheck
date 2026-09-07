// Renders the company directory from the same OWNERSHIP_DATA object the
// extension itself uses (extension-data.js is a copy of data.js — see the
// README note in this folder about keeping them in sync).

document.addEventListener("DOMContentLoaded", () => {
  const entries = Object.entries(OWNERSHIP_DATA).map(([domain, v]) => ({ domain, ...v }));
  entries.sort((a, b) => a.brand.localeCompare(b.brand));

  // Category tab order is fixed rather than derived from the data, so the
  // tabs don't reshuffle every time a company is added. Anything with a
  // category not listed here still renders — it lands in "Other".
  const CATEGORY_ORDER = [
    "Grocery & Pharmacy",
    "Retail & Department Stores",
    "Apparel & Fashion",
    "Food & Drink",
    "Personal Care & Household",
    "Home & Furniture",
    "Telecom & Mobile",
    "Banking & Insurance",
    "Media & Entertainment",
    "Dating & Social",
    "Travel & Transportation",
    "Gas & Convenience",
    "Tech & Online Services",
    "Professional Services",
  ];

  const usedCategories = CATEGORY_ORDER.filter((c) => entries.some((e) => e.category === c));
  const uncategorized = entries.filter((e) => !usedCategories.includes(e.category));
  if (uncategorized.length > 0) usedCategories.push("Other");

  const listEl = document.getElementById("company-list");
  const countEl = document.getElementById("company-count");
  const searchEl = document.getElementById("company-search");
  const tabsEl = document.getElementById("category-tabs");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeFilter = "all";
  let activeCategory = "all";
  let searchTerm = "";

  // ---- Build the category tabs ----
  const tabDefs = [{ key: "all", label: "All categories" }].concat(
    usedCategories.map((c) => ({ key: c, label: c }))
  );

  tabsEl.innerHTML = tabDefs
    .map((t) => {
      const count = t.key === "all" ? entries.length : categoryOf(t.key).length;
      return `<button class="cat-tab${t.key === "all" ? " active" : ""}" data-category="${escapeAttr(t.key)}">${t.label} <span class="cat-tab-count">${count}</span></button>`;
    })
    .join("");

  tabsEl.querySelectorAll(".cat-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeCategory = tab.dataset.category;
      tabsEl.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      render();
    });
  });

  function categoryOf(cat) {
    if (cat === "Other") return uncategorized;
    return entries.filter((e) => e.category === cat);
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  }

  // Searching by product ("shoes", "coffee", "detergent") only works if the
  // text describing what a company sells is searchable. The notes already
  // carry that, so they go into the haystack alongside the alternatives —
  // which is what makes a search for a US brand surface the Canadian options
  // named in its entry. Built once per entry rather than per keystroke.
  const haystacks = new Map();
  function haystackFor(e) {
    let h = haystacks.get(e.domain);
    if (h === undefined) {
      h = [
        e.brand,
        e.domain,
        e.hq || "",
        e.category || "",
        (e.tags || []).join(" "),
        e.note || "",
        (e.alternatives || []).join(" "),
        (e.otherAlternatives || []).join(" "),
        e.alternativesNote || "",
      ]
        .join(" ")
        .toLowerCase();
      haystacks.set(e.domain, h);
    }
    return h;
  }

  function tagFor(entry) {
    if (entry.ownership === "Canada") return { cls: "tag-ca", text: "Canadian" };
    if (entry.ownership === "US") return { cls: "tag-us", text: "US-owned" };
    if (entry.ownership === "not-US") return { cls: "tag-notus", text: "Not US-owned" };
    return { cls: "tag-notus", text: "Unclear" };
  }

  // The dataset is keyed by domain, so the store link needs no extra data —
  // but only build one from a domain that actually looks like a hostname,
  // so a malformed key can never turn into an unexpected href.
  const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

  function storeLinkHtml(domain) {
    if (!DOMAIN_RE.test(domain)) return "";
    return `<a class="company-link" href="https://${domain}" target="_blank" rel="noopener noreferrer">${domain} ↗</a>`;
  }

  // Where something is made is a different question from who owns it, so it
  // gets its own marker rather than being folded into the ownership tag.
  // Absent means the company hasn't said publicly — shown as nothing rather
  // than as a guess.
  const MADE_IN_LABELS = {
    Canada: { cls: "made-ca", text: "Made in Canada" },
    mixed: { cls: "made-mixed", text: "Partly made in Canada" },
    imported: { cls: "made-imported", text: "Made abroad" },
  };

  function madeInHtml(e) {
    const m = MADE_IN_LABELS[e.madeIn];
    return m ? `<span class="made-tag ${m.cls}">${m.text}</span>` : "";
  }

  // Two warnings that deliberately are NOT the ownership tag.
  //
  // A company being sold is still owned by its current owners until the deal
  // closes, and deals do fall through — so the tag keeps saying what is
  // legally true while these say what is coming. Same for a Canadian company
  // under foreign control: calling Roots "US-owned" would be wrong, and
  // saying only "Canadian" would be misleading. The label stays accurate and
  // the warning sits beside it where it cannot be missed.
  function alertsHtml(e) {
    let out = "";
    if (e.changingTo) {
      out += `<span class="alert-tag alert-changing">⚠ Sale agreed — becoming ${e.changingTo}</span>`;
    }
    if (e.controlledFrom) {
      out += `<span class="alert-tag alert-control">⚠ ${e.controlledFrom}-controlled</span>`;
    }
    return out;
  }

  // Flagged entries get a way for readers to contribute what they know.
  //
  // This points at the submission form rather than a mailto: a mailto link
  // silently does nothing for anyone without a desktop mail client set up,
  // which is most people on webmail — the click just appears to fail.
  //
  // company and domain ride along as query parameters so a submission arrives
  // already attached to the right entry. Tally populates hidden fields with
  // matching names; if those fields do not exist it ignores the parameters,
  // so this is safe either way.
  const SUBMIT_FORM = "https://tally.so/r/1AeroQ";

  function verifyActionHtml(e) {
    if (e.confidence !== "verify") return "";
    const params = new URLSearchParams({ company: e.brand, domain: e.domain });
    return `<a class="verify-btn" href="${SUBMIT_FORM}?${params}" target="_blank" rel="noopener">Know who owns this? Help verify →</a>`;
  }

  function rowHtml(e) {
    const tag = tagFor(e);
    const verifyBadge = e.confidence === "verify" ? `<div class="verify-note">⚠ Still being verified</div>` : "";
    return `
      <div class="company-row">
        <div>
          <div class="company-brand">${e.brand}</div>
          ${storeLinkHtml(e.domain)}
          ${madeInHtml(e)}
          ${alertsHtml(e)}
          ${e.note ? `<div class="company-note">${e.note}</div>` : ""}
          ${verifyBadge}
          ${verifyActionHtml(e)}
        </div>
        <div class="company-tag ${tag.cls}">${tag.text}</div>
        <div class="company-hq">${e.hq || ""}</div>
      </div>
    `;
  }

  function render() {
    const filtered = entries.filter((e) => {
      const matchesOwnership =
        activeFilter === "all" ||
        (activeFilter === "ca" && e.ownership === "Canada") ||
        (activeFilter === "us" && e.ownership === "US");
      const matchesCategory =
        activeCategory === "all" ||
        (activeCategory === "Other" ? !usedCategories.includes(e.category) : e.category === activeCategory);
      const matchesSearch = !searchTerm || haystackFor(e).includes(searchTerm.toLowerCase());
      return matchesOwnership && matchesCategory && matchesSearch;
    });

    countEl.textContent = `Showing ${filtered.length} of ${entries.length} companies`;

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="company-row"><div class="company-note">No matches. If you think a company should be here, <a href="contact.html">let us know</a>.</div></div>`;
      return;
    }

    // With "All categories" selected, group under category headings instead of
    // one flat alphabetical run — that's the whole point of categorizing.
    // With a single category selected, the heading would be redundant, so the
    // list renders flat.
    if (activeCategory === "all") {
      listEl.innerHTML = usedCategories
        .map((cat) => {
          const inCat = filtered.filter((e) =>
            cat === "Other" ? !usedCategories.includes(e.category) : e.category === cat
          );
          if (inCat.length === 0) return "";
          return `
            <div class="category-group">
              <h3 class="category-heading">${cat} <span class="category-heading-count">${inCat.length}</span></h3>
              ${inCat.map(rowHtml).join("")}
            </div>
          `;
        })
        .join("");
    } else {
      listEl.innerHTML = filtered.map(rowHtml).join("");
    }
  }

  searchEl.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.remove("active-ca", "active-us", "active-all"));
      if (activeFilter === "ca") btn.classList.add("active-ca");
      else if (activeFilter === "us") btn.classList.add("active-us");
      else btn.classList.add("active-all");
      render();
    });
  });

  render();
});
