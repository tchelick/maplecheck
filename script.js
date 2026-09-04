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

  function tagFor(entry) {
    if (entry.ownership === "Canada") return { cls: "tag-ca", text: "Canadian" };
    if (entry.ownership === "US") return { cls: "tag-us", text: "US-owned" };
    if (entry.ownership === "not-US") return { cls: "tag-notus", text: "Not US-owned" };
    return { cls: "tag-notus", text: "Unclear" };
  }

  function rowHtml(e) {
    const tag = tagFor(e);
    const verifyBadge = e.confidence === "verify" ? `<div class="verify-note">⚠ Still being verified</div>` : "";
    return `
      <div class="company-row">
        <div>
          <div class="company-brand">${e.brand}</div>
          ${e.note ? `<div class="company-note">${e.note}</div>` : ""}
          ${verifyBadge}
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
      const haystack = `${e.brand} ${e.domain} ${e.hq || ""} ${e.category || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
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
