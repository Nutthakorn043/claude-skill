/**
 * Generate the site's data from a claude-skills checkout.
 *
 *   node scripts/build-data.mjs ../claude-skills-main
 *
 * Writes two things:
 *   data/index.json            metadata for every skill, bundled into the page
 *   public/data/body/<slug>.json   one SKILL.md body per file, fetched on demand
 *
 * Splitting them is the point: the list needs ~250 KB, the bodies are ~3.5 MB
 * and are only needed once a reader opens or copies a specific skill.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";

// Mirror trees for other agents hold copies of the same skills.
const SKIP = new Set([".gemini", ".codex", ".vibe", ".hermes", ".git", "node_modules"]);

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

const source = process.argv[2];
if (!source || !statSync(source, { throwIfNoEntry: false })?.isDirectory()) {
  console.error("usage: node scripts/build-data.mjs <path-to-claude-skills-checkout>");
  process.exit(1);
}

const files = walk(source);
if (files.length === 0) {
  console.error("no SKILL.md found under " + source);
  process.exit(1);
}

// Thai descriptions, keyed by slug. Missing entries fall back to English, so
// the site stays correct while the translation is still being filled in.
let thai = {};
try {
  thai = JSON.parse(readFileSync("data/th.json", "utf8"));
} catch {
  console.warn("data/th.json not found or unreadable - shipping English only");
}

const skills = [];
const bodies = new Map();

for (const file of files) {
  const rel = relative(source, file).split(sep).join("/");
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

  const slug = dir.replace(/\//g, "--");
  const name = readField(lines, "name");
  const description = readField(lines, "description");

  skills.push({
    slug,
    path: rel,
    dir,
    domain: parts[0],
    group,
    name,
    description,
    descriptionTh: thai[slug] ?? "",
    version: readField(lines, "version"),
    scripts: countFiles(join(dirname(file), "scripts"), ".py"),
    references: countFiles(join(dirname(file), "references"), ".md"),
    bodyBytes: Buffer.byteLength(body, "utf8"),
  });
  bodies.set(slug, body);
}

skills.sort(
  (a, b) =>
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
  domains: new Set(skills.map((s) => s.domain)).size,
  scripts: skills.reduce((n, s) => n + s.scripts, 0),
  references: skills.reduce((n, s) => n + s.references, 0),
  plugins: countPlugins(source),
};

mkdirSync("data", { recursive: true });
writeFileSync("data/index.json", JSON.stringify({ stats, skills }), "utf8");

const indexKb = statSync("data/index.json").size / 1024;
const bodyMb = [...bodies.values()].reduce((n, b) => n + Buffer.byteLength(b, "utf8"), 0) / 1048576;

console.log(`data/index.json          ${indexKb.toFixed(0)} KB`);
console.log(`public/data/body/*.json  ${bodies.size} files, ${bodyMb.toFixed(2)} MB total`);
console.log(
  `${stats.skills} skills  ${stats.domains} domains  ${stats.scripts} scripts  ` +
    `${stats.references} references  ${stats.plugins} plugins`
);

const translated = skills.filter((s) => s.descriptionTh).length;
console.log(
  `thai descriptions          ${translated}/${skills.length} ` +
    `(${Math.round((translated / skills.length) * 100)}%)`
);
