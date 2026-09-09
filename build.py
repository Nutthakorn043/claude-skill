#!/usr/bin/env python3
"""Build index.html from a claude-skills checkout.

Scans every SKILL.md in the source tree, extracts its YAML frontmatter and body,
counts the Python scripts and reference documents that ship beside it, then
injects the whole dataset into template.html.

Usage:
    python build.py ../claude-skills-main
    python build.py /path/to/claude-skills --out index.html

Standard library only. No network access.
"""

import argparse
import json
import os
import re
import sys

# Mirror trees for other agents hold copies of the same skills — skipping them
# keeps the count honest.
SKIP_DIRS = {".gemini", ".codex", ".vibe", ".hermes", ".git", "node_modules"}

FRONTMATTER = re.compile(r"^---\s*?\n(.*?)\n---\n?", re.S)


def read_field(lines, key):
    """Read one frontmatter field, following folded/literal block scalars."""
    idx = None
    for i, line in enumerate(lines):
        if line.startswith(key + ":"):
            idx = i
            break
    if idx is None:
        return ""
    value = lines[idx][len(key) + 1:].strip()
    if value in (">-", "|", ">", "|-", ""):
        buf = []
        for line in lines[idx + 1:]:
            if line and not line[0].isspace():
                break
            buf.append(line.strip())
        return " ".join(buf).strip().strip('"')
    return value.strip().strip('"').strip("'")


def count_files(directory, *extensions):
    if not os.path.isdir(directory):
        return 0
    return len([f for f in os.listdir(directory) if f.endswith(extensions)])


def count_plugins(root):
    """Number of plugins in the marketplace registry, 0 when it is absent."""
    manifest = os.path.join(root, ".claude-plugin", "marketplace.json")
    try:
        with open(manifest, encoding="utf-8") as fh:
            return len(json.load(fh).get("plugins", []))
    except (OSError, ValueError):
        return 0


def collect(root):
    skills = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if "SKILL.md" not in filenames:
            continue

        abs_path = os.path.join(dirpath, "SKILL.md")
        rel = os.path.relpath(abs_path, root).replace(os.sep, "/")
        rel_dir = os.path.dirname(rel)

        with open(abs_path, encoding="utf-8", errors="replace") as fh:
            text = fh.read().replace("\r", "")

        match = FRONTMATTER.match(text)
        frontmatter = match.group(1) if match else ""
        body = text[match.end():].strip() if match else text.strip()
        lines = frontmatter.split("\n")

        parts = rel.split("/")
        if "skills" in parts:
            group = "/".join(parts[:parts.index("skills")])
        elif len(parts) > 2:
            group = "/".join(parts[:-2])
        else:
            group = parts[0]

        skills.append({
            "p": rel,
            "c": parts[0],
            "g": group,
            "n": read_field(lines, "name"),
            "d": read_field(lines, "description"),
            "v": read_field(lines, "version"),
            "t": count_files(os.path.join(dirpath, "scripts"), ".py"),
            "r": count_files(os.path.join(dirpath, "references"), ".md"),
            "dir": rel_dir,
            "b": body,
        })

    skills.sort(key=lambda s: (s["c"].lower(), s["g"].lower(), s["n"].lower()))
    return skills


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", help="path to a claude-skills checkout")
    parser.add_argument("--template", default="template.html")
    parser.add_argument("--out", default="index.html")
    args = parser.parse_args()

    if not os.path.isdir(args.source):
        sys.exit("source directory not found: " + args.source)

    skills = collect(args.source)
    if not skills:
        sys.exit("no SKILL.md files found under " + args.source)

    with open(args.template, encoding="utf-8") as fh:
        template = fh.read()
    if "__SKILLS_JSON__" not in template:
        sys.exit("template is missing the __SKILLS_JSON__ placeholder")

    payload = json.dumps(skills, ensure_ascii=False, separators=(",", ":"))
    # Escaping "<" keeps skill bodies from terminating the inline <script>.
    payload = payload.replace("<", "\\u003c")

    domains = len({s["c"] for s in skills})
    tools = sum(s["t"] for s in skills)
    refs = sum(s["r"] for s in skills)
    plugins = count_plugins(args.source)

    page = template.replace("__SKILLS_JSON__", payload)
    for token, value in (("__N_SKILLS__", len(skills)), ("__N_DOMAINS__", domains),
                         ("__N_TOOLS__", tools), ("__N_REFS__", refs),
                         ("__N_PLUGINS__", plugins)):
        page = page.replace(token, str(value))

    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(page)

    size_mb = os.path.getsize(args.out) / 1048576

    print("wrote {0}  ({1:.2f} MB)".format(args.out, size_mb))
    print("{0} skills  {1} domains  {2} scripts  {3} references".format(
        len(skills), domains, tools, refs))


if __name__ == "__main__":
    main()
