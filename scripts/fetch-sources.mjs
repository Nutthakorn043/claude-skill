/**
 * Clone or update every repository listed in data/sources.json.
 *
 *   node scripts/fetch-sources.mjs            all sources
 *   node scripts/fetch-sources.mjs <id> ...   only these
 *
 * Checkouts land in sources/<id>/ (gitignored) as shallow clones, because the
 * build only ever reads the working tree — no history is needed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SOURCES_DIR = "sources";

function git(args, cwd) {
  return execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

const sources = JSON.parse(readFileSync("data/sources.json", "utf8"));
const wanted = process.argv.slice(2);
const selected = wanted.length ? sources.filter((s) => wanted.includes(s.id)) : sources;

if (!selected.length) {
  console.error("no matching source. known ids: " + sources.map((s) => s.id).join(", "));
  process.exit(1);
}

mkdirSync(SOURCES_DIR, { recursive: true });

let failed = 0;
for (const source of selected) {
  const dir = join(SOURCES_DIR, source.id);
  const branch = source.branch ?? "main";
  const remote = `https://github.com/${source.repo}.git`;

  try {
    if (existsSync(join(dir, ".git"))) {
      git(["fetch", "--depth", "1", "origin", branch], dir);
      git(["reset", "--hard", `origin/${branch}`], dir);
      console.log(`updated  ${source.id}  (${git(["rev-parse", "--short", "HEAD"], dir)})`);
    } else {
      git(["clone", "--depth", "1", "--branch", branch, remote, dir]);
      console.log(`cloned   ${source.id}  (${git(["rev-parse", "--short", "HEAD"], dir)})`);
    }
  } catch (error) {
    failed += 1;
    console.error(`FAILED   ${source.id}: ${String(error.stderr ?? error.message).trim()}`);
  }
}

if (failed) {
  console.error(`\n${failed} source(s) failed. The build will skip whatever is missing.`);
  process.exit(1);
}
console.log(`\n${selected.length} source(s) ready under ${SOURCES_DIR}/`);
