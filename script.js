// Renders the company directory from the same OWNERSHIP_DATA object the
// extension itself uses (extension-data.js is a copy of data.js — see the
// README note in this folder about keeping them in sync).

document.addEventListener("DOMContentLoaded", () => {
  const entries = Object.entries(OWNERSHIP_DATA).map(([domain, v]) => ({ domain, ...v }));
  entries.sort((a, b) => a.brand.localeCompare(b.brand));

  const listEl = document.getElementById("company-list");
  const countEl = document.getElementById("company-count");
  const searchEl = document.getElementById("company-search");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeFilter = "all";
  let searchTerm = "";

  function tagFor(entry) {
    if (entry.ownership === "Canada") return { cls: "tag-ca", text: "Canadian" };
    if (entry.ownership === "US") return { cls: "tag-us", text: "US-owned" };
    if (entry.ownership === "not-US") return { cls: "tag-notus", text: "Not US-owned" };
    return { cls: "tag-notus", text: "Unclear" };
  }

  function render() {
    const filtered = entries.filter((e) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "ca" && e.ownership === "Canada") ||
        (activeFilter === "us" && e.ownership === "US");
      const haystack = `${e.brand} ${e.domain} ${e.hq || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    countEl.textContent = `Showing ${filtered.length} of ${entries.length} companies`;

    listEl.innerHTML = filtered
      .map((e) => {
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
      })
      .join("");

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="company-row"><div class="company-note">No matches. If you think a company should be here, <a href="contact.html">let us know</a>.</div></div>`;
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
