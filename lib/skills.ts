export type Skill = {
  slug: string;
  path: string;
  dir: string;
  domain: string;
  group: string;
  name: string;
  description: string;
  version: string;
  scripts: number;
  references: number;
  bodyBytes: number;
};

export type Stats = {
  skills: number;
  domains: number;
  scripts: number;
  references: number;
  plugins: number;
};

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

export function rawIndex(s: Skill): string {
  return `${s.name} ${s.description} ${s.path}`.toLowerCase();
}

export function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
}

export function installCommand(s: Skill): string {
  return [
    "# รันคำสั่งนี้จากในโฟลเดอร์ claude-skills-main",
    `mkdir -p ~/.claude/skills && cp -r ${s.dir} ~/.claude/skills/`,
  ].join("\n");
}

export function portablePrompt(s: Skill, body: string): string {
  const lines = [
    `# Skill: ${s.name}`,
    s.description,
    "",
    `Source: alirezarezvani/claude-skills (MIT license) — ${s.path}`,
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
