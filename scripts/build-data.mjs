/**
 * Generate the site's data from every checkout listed in data/sources.json.
 *
 *   node scripts/fetch-sources.mjs     # clone / update the checkouts first
 *   node scripts/build-data.mjs
 *
 * Writes two things:
 *   data/index.json                metadata for every skill, bundled into the page
 *   public/data/body/<slug>.json   one SKILL.md body per file, fetched on demand
 *
 * Splitting them is the point: the list needs a few hundred KB, the bodies are
 * megabytes and are only needed once a reader opens or copies a specific skill.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";

// Mirror trees for other agents hold copies of the same skills.
const SKIP = new Set([".gemini", ".codex", ".vibe", ".hermes", ".git", "node_modules"]);
const SOURCES_DIR = "sources";

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else if (entry.name === "SKILL.md") {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

/** Read one frontmatter field, following folded and literal block scalars. */
function readField(lines, key) {
  const i = lines.findIndex((l) => l.startsWith(key + ":"));
  if (i < 0) return "";
  const value = lines[i].slice(key.length + 1).trim();
  if (![">-", "|", ">", "|-", ""].includes(value)) {
    return value.replace(/^["']|["']$/g, "").trim();
  }
  const buf = [];
  for (const line of lines.slice(i + 1)) {
    if (line && !/^\s/.test(line)) break;
    buf.push(line.trim());
  }
  return buf.join(" ").replace(/^"|"$/g, "").trim();
}

function countFiles(dir, ext) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(ext)).length;
  } catch {
    return 0;
  }
}

function countPlugins(root) {
  try {
    const raw = readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8");
    return (JSON.parse(raw).plugins ?? []).length;
  } catch {
    return 0;
  }
}

/** Domain = the first path segment that is not generic packaging. */
const GENERIC = new Set(["plugins", "skills", "src", "packages"]);
function domainOf(parts) {
  for (const part of parts.slice(0, -1)) {
    if (!GENERIC.has(part)) return part;
  }
  return parts[0];
}

const sources = JSON.parse(readFileSync("data/sources.json", "utf8"));

let thai = {};
try {
  thai = JSON.parse(readFileSync("data/th.json", "utf8"));
} catch {
  console.warn("data/th.json not found - shipping English only");
}

const skills = [];
const bodies = new Map();
const perSource = [];

for (const source of sources) {
  const root = join(SOURCES_DIR, source.id);
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    console.warn(`skipped  ${source.id}: no checkout at ${root} (run fetch-sources.mjs)`);
    continue;
  }

  const files = walk(root);
  let count = 0;

  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    const dir = dirname(rel);
    const text = readFileSync(file, "utf8").replace(/\r/g, "");

    const match = /^---\s*?\n([\s\S]*?)\n---\n?/.exec(text);
    const lines = (match ? match[1] : "").split("\n");
    const body = (match ? text.slice(match[0].length) : text).trim();

    const parts = rel.split("/");
    const skillsAt = parts.indexOf("skills");
    const group =
      skillsAt > 0 ? parts.slice(0, skillsAt).join("/")
      : parts.length > 2 ? parts.slice(0, -2).join("/")
      : parts[0];

    // Source-prefixed so two repos can ship a skill of the same name.
    const slug = `${source.id}--${dir.replace(/\//g, "--")}`;
    const name = readField(lines, "name") || parts[parts.length - 2] || dir;

    skills.push({
      slug,
      source: source.id,
      path: rel,
      dir,
      domain: domainOf(parts),
      group,
      name,
      description: readField(lines, "description"),
      descriptionTh: thai[slug] ?? "",
      version: readField(lines, "version"),
      scripts: countFiles(join(dirname(file), "scripts"), ".py"),
      references: countFiles(join(dirname(file), "references"), ".md"),
      bodyBytes: Buffer.byteLength(body, "utf8"),
    });
    bodies.set(slug, body);
    count += 1;
  }

  perSource.push({ ...source, skills: count, plugins: countPlugins(root) });
}

if (!skills.length) {
  console.error("no skills found in any source - run scripts/fetch-sources.mjs first");
  process.exit(1);
}

skills.sort(
  (a, b) =>
    a.source.localeCompare(b.source) ||
    a.domain.localeCompare(b.domain) ||
    a.group.localeCompare(b.group) ||
    a.name.localeCompare(b.name)
);

const bodyDir = join("public", "data", "body");
rmSync(bodyDir, { recursive: true, force: true });
mkdirSync(bodyDir, { recursive: true });
for (const [slug, body] of bodies) {
  writeFileSync(join(bodyDir, `${slug}.json`), JSON.stringify({ body }), "utf8");
}

const stats = {
  skills: skills.length,
  sources: perSource.length,
  domains: new Set(skills.map((s) => `${s.source}/${s.domain}`)).size,
  scripts: skills.reduce((n, s) => n + s.scripts, 0),
  references: skills.reduce((n, s) => n + s.references, 0),
};

mkdirSync("data", { recursive: true });
writeFileSync("data/index.json", JSON.stringify({ stats, sources: perSource, skills }), "utf8");

const indexKb = statSync("data/index.json").size / 1024;
const bodyMb = [...bodies.values()].reduce((n, b) => n + Buffer.byteLength(b, "utf8"), 0) / 1048576;
const translated = skills.filter((s) => s.descriptionTh).length;

console.log(`data/index.json          ${indexKb.toFixed(0)} KB`);
console.log(`public/data/body/*.json  ${bodies.size} files, ${bodyMb.toFixed(2)} MB total`);
for (const s of perSource) console.log(`  ${s.id.padEnd(20)} ${String(s.skills).padStart(4)} skills`);
console.log(
  `${stats.skills} skills  ${stats.sources} sources  ${stats.domains} domains  ` +
    `${stats.scripts} scripts  ${stats.references} references`
);
console.log(
  `thai descriptions        ${translated}/${skills.length} ` +
    `(${Math.round((translated / skills.length) * 100)}%)`
);
