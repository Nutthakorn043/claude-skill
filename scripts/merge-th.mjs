/**
 * Merge a batch of Thai descriptions into data/th.json.
 *
 *   node scripts/merge-th.mjs <batch.json>
 *
 * Every key must be a slug that exists in data/index.json, so a typo fails
 * loudly instead of silently producing an entry nothing will ever read.
 */
import { readFileSync, writeFileSync } from "node:fs";

const batchPath = process.argv[2];
if (!batchPath) {
  console.error("usage: node scripts/merge-th.mjs <batch.json>");
  process.exit(1);
}

const index = JSON.parse(readFileSync("data/index.json", "utf8"));
const known = new Set(index.skills.map((s) => s.slug));

const current = JSON.parse(readFileSync("data/th.json", "utf8"));
const batch = JSON.parse(readFileSync(batchPath, "utf8"));

const unknown = Object.keys(batch).filter((slug) => !known.has(slug));
if (unknown.length) {
  console.error("unknown slugs:\n  " + unknown.join("\n  "));
  process.exit(1);
}

const empty = Object.entries(batch).filter(([, v]) => typeof v !== "string" || v.trim().length < 20);
if (empty.length) {
  console.error("suspiciously short translations: " + empty.map(([k]) => k).join(", "));
  process.exit(1);
}

const added = Object.keys(batch).filter((slug) => !current[slug]).length;
const updated = Object.keys(batch).length - added;

Object.assign(current, batch);

// Sorted so diffs stay readable as batches land.
const sorted = Object.fromEntries(Object.keys(current).sort().map((k) => [k, current[k]]));
writeFileSync("data/th.json", JSON.stringify(sorted, null, 1) + "\n", "utf8");

const done = Object.keys(sorted).length;
const total = index.skills.length;
console.log(
  `+${added} new, ${updated} updated -> ${done}/${total} (${Math.round((done / total) * 100)}%)`
);

const missing = index.skills.filter((s) => !sorted[s.slug]);
if (missing.length) {
  console.log(`next up: ${missing.slice(0, 3).map((s) => s.slug).join(", ")}`);
}
