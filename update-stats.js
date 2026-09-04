// update-stats.js — recalculates the homepage stat counts from the live
// dataset instead of leaving them hand-typed and easy to forget.
//
// Usage: node update-stats.js <path-to-extension-data.js> <path-to-index.html>
// Called automatically by sync-data.sh after extension-data.js is copied in.

const fs = require("fs");

const [, , dataPath, indexPath] = process.argv;
if (!dataPath || !indexPath) {
  console.error("Usage: node update-stats.js <extension-data.js> <index.html>");
  process.exit(1);
}

const dataSrc = fs.readFileSync(dataPath, "utf8");
const OWNERSHIP_DATA = new Function(`${dataSrc}\nreturn OWNERSHIP_DATA;`)();

const entries = Object.values(OWNERSHIP_DATA);
const total = entries.length;
const canadian = entries.filter((e) => e.ownership === "Canada").length;
const us = entries.filter((e) => e.ownership === "US").length;
const flagged = entries.filter((e) => e.confidence === "verify").length;

let html = fs.readFileSync(indexPath, "utf8");

const replacements = [
  [/(<div class="stat-num">)\d+(<\/div>)/, total],
  [/(<div class="stat-num red">)\d+(<\/div>)/, canadian],
  [/(<div class="stat-num blue">)\d+(<\/div>)/, us],
  [/(<div class="stat-num gold">)\d+(<\/div>)/, flagged],
];

for (const [pattern, value] of replacements) {
  if (!pattern.test(html)) {
    console.error(`Warning: could not find pattern ${pattern} in ${indexPath} — stat left unchanged.`);
    continue;
  }
  html = html.replace(pattern, `$1${value}$2`);
}

fs.writeFileSync(indexPath, html);
console.log(`Stats updated: ${total} total, ${canadian} Canadian, ${us} US, ${flagged} flagged for review`);
