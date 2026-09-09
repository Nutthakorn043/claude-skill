/** A record exactly as data/index.json stores it. Server side only. */
export type RawSkill = {
  slug: string;
  /** id of the repository this skill came from; see data/sources.json. */
  source: string;
  path: string;
  dir: string;
  domain: string;
  group: string;
  name: string;
  description: string;
  /** Thai translation of `description`; empty when not translated yet. */
  descriptionTh: string;
  version: string;
  scripts: number;
  references: number;
  bodyBytes: number;
};

/**
 * What the browser actually receives. Every field here is serialised 506 times
 * into the page, so `dir` (always `path` minus the filename) and `group` (only
 * ever shown as its last segment) are dropped in favour of things derived once
 * on the server.
 */
export type Skill = Omit<RawSkill, "dir" | "group"> & {
  /** Folder between the domain and the skill, shown next to the name. */
  bundle: string;
};

/** `agent-launcher/skills/foo/SKILL.md` -> `agent-launcher/skills/foo` */
export function dirOf(s: Skill): string {
  return s.path.replace(/\/[^/]*$/, "");
}

export function toSkill({ dir: _dir, group, ...rest }: RawSkill): Skill {
  // The old label sliced `domain.length + 1` off the front of `group`, which
  // cut mid-word whenever the domain was not the leading path segment
  // ("plugins/agent-plugins/earnings-reviewer" showed as
  // "plugins/earnings-reviewer"). The trailing segment is the bundle in both
  // shapes.
  const last = group.slice(group.lastIndexOf("/") + 1);
  return { ...rest, bundle: last === rest.domain ? "" : last };
}

export type Stats = {
  skills: number;
  sources: number;
  domains: number;
  scripts: number;
  references: number;
};

export type Source = {
  id: string;
  label: string;
  repo: string;
  url: string;
  license: string;
  note?: string;
  skills: number;
};

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Absolute origin, needed for canonical links, Open Graph and the sitemap. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export const DOMAIN_LABEL: Record<string, string> = {
  engineering: "Engineering (POWERFUL tier)",
  "engineering-team": "Engineering Team",
  "marketing-skill": "Marketing",
  "c-level-advisor": "C-Level Advisory",
  "c-level-agents": "C-Level Agents",
  "ra-qm-team": "Regulatory & Quality",
  "product-team": "Product",
  productivity: "Productivity",
  research: "Research (academic)",
  "compliance-os": "Compliance OS",
  "project-management": "Project Management",
  commercial: "Commercial",
  "business-operations": "Business Operations",
  marketing: "Marketing (channels)",
  "agent-launcher": "Agent Launcher",
  "business-growth": "Business & Growth",
  finance: "Finance",
  "markdown-html": "Markdown to HTML",
  "research-ops": "Research Operations",
  "loop-library": "Loop Library",
};

export type Platform = {
  id: string;
  label: string;
  install: boolean;
  hint: string;
};

export const PLATFORMS: Platform[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    install: true,
    hint: "คัดลอกคำสั่งไปรันใน terminal ที่โฟลเดอร์ claude-skills-main แล้วเปิด session ใหม่ สกิลจะถูกเรียกอัตโนมัติ หรือพิมพ์ /ชื่อสกิล ก็ได้",
  },
  {
    id: "claude-ai",
    label: "Claude.ai",
    install: false,
    hint: "สร้าง Project ใหม่ → ช่อง Instructions → วางที่คัดลอกไว้ ทุกแชทใน Project นั้นจะใช้สกิลนี้ หรือวางเป็นข้อความแรกถ้าอยากใช้แค่แชทเดียว",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    install: false,
    hint: "สร้าง Custom GPT → Configure → ช่อง Instructions → วางที่คัดลอกไว้ (หรือใช้ Project instructions ก็ได้ผลเหมือนกัน)",
  },
  {
    id: "gemini",
    label: "Gemini",
    install: false,
    hint: "เปิด Gem manager → New Gem → ช่อง Instructions → วางที่คัดลอกไว้ หรือวางเป็นข้อความแรกในแชทธรรมดา",
  },
];

/** Word-start haystack. "iso" must not match inside "advisor". */
export function wordIndex(s: Skill): string {
  const tokens = `${s.name} ${s.description} ${s.path}`
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter(Boolean);
  return ` ${tokens.join(" ")} `;
}

/** Everything a free-text query can match, both languages at once. */
export function rawIndex(s: Skill): string {
  return `${s.name} ${s.description} ${s.descriptionTh} ${s.path}`.toLowerCase();
}

export type Lang = "th" | "en" | "both";

/** The description to show, falling back to English where Thai is missing. */
export function describe(s: Skill, lang: Lang): { main: string; sub: string } {
  if (lang === "en" || !s.descriptionTh) return { main: s.description, sub: "" };
  if (lang === "th") return { main: s.descriptionTh, sub: "" };
  return { main: s.descriptionTh, sub: s.description };
}

export function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
}

/**
 * Self-contained: clones the source into a cache directory first, so the same
 * command works from any directory and for any repository in the index.
 */
export function installCommand(s: Skill, source: Source): string {
  return [
    `# ติดตั้ง ${s.name} จาก ${source.repo} (${source.license})`,
    `SRC=~/.cache/claude-skill-sources/${source.id}`,
    `git clone --depth 1 https://github.com/${source.repo}.git "$SRC" 2>/dev/null || git -C "$SRC" pull --quiet`,
    `mkdir -p ~/.claude/skills && cp -r "$SRC/${dirOf(s)}" ~/.claude/skills/`,
  ].join("\n");
}

export function portablePrompt(s: Skill, body: string, source: Source): string {
  const lines = [
    `# Skill: ${s.name}`,
    s.description,
    "",
    `Source: ${source.repo} (${source.license} license) — ${s.path}`,
    "",
    "Adopt the skill below for the rest of this conversation. When my request falls inside its scope, follow its workflows, frameworks and output formats exactly. When it does not, answer normally and do not force the skill onto the task.",
    "",
    "===== SKILL START =====",
    body,
    "===== SKILL END =====",
  ];
  if (s.scripts || s.references) {
    const bits: string[] = [];
    if (s.scripts) bits.push(`${s.scripts} Python script${s.scripts > 1 ? "s" : ""}`);
    if (s.references)
      bits.push(`${s.references} reference document${s.references > 1 ? "s" : ""}`);
    lines.push(
      "",
      `Note: the original package also ships ${bits.join(" and ")} that are NOT included here. ` +
        "Where the instructions above tell you to run `python scripts/...`, perform the equivalent " +
        "analysis yourself and say that you did it by reasoning rather than by running the tool."
    );
  }
  return lines.join("\n");
}
