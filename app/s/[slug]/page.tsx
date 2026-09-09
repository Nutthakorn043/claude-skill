import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import data from "@/data/index.json";
import SkillActions from "@/components/SkillActions";
import {
  BASE,
  DOMAIN_LABEL,
  type RawSkill,
  type Source,
  formatBytes,
  installCommand,
  toSkill,
} from "@/lib/skills";

const skills = (data.skills as RawSkill[]).map(toSkill);
const sources = data.sources as Source[];
const bySlug = new Map(skills.map((s) => [s.slug, s]));
const sourceById = new Map(sources.map((x) => [x.id, x]));

/** Read at build time from the same files the browser fetches on demand. */
function readBody(slug: string): string {
  const file = join(process.cwd(), "public", "data", "body", `${slug}.json`);
  return (JSON.parse(readFileSync(file, "utf8")) as { body: string }).body;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return skills.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = bySlug.get(slug);
  if (!skill) return {};
  const source = sourceById.get(skill.source)!;
  const description = skill.descriptionTh || skill.description;

  return {
    title: `${skill.name} — สกิลจาก ${source.repo}`,
    description: description.slice(0, 300),
    alternates: { canonical: `/s/${skill.slug}/` },
    openGraph: {
      type: "article",
      title: `${skill.name} — Claude Skills Index`,
      description: description.slice(0, 300),
      url: `/s/${skill.slug}/`,
    },
  };
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = bySlug.get(slug)!;
  const source = sourceById.get(skill.source)!;
  const body = readBody(skill.slug);

  const siblings = skills
    .filter((s) => s.domain === skill.domain && s.source === skill.source && s.slug !== skill.slug)
    .slice(0, 12);

  return (
    <>
      <header className="top">
        <div className="wrap">
          <nav className="crumbs" aria-label="เส้นทาง">
            <a href={`${BASE}/`}>ดัชนีสกิล</a>
            <span aria-hidden="true">/</span>
            <span>{DOMAIN_LABEL[skill.domain] ?? skill.domain}</span>
          </nav>
          <div className="mast">
            <p className="eyebrow">{source.label}</p>
            <h1 className="mono">{skill.name}</h1>
            {skill.descriptionTh && <p className="sub">{skill.descriptionTh}</p>}
            <p className="sub" lang="en">
              {skill.description}
            </p>
          </div>
        </div>
      </header>

      <div className="wrap page">
        <div className="detail">
          <div className="path">{skill.path}</div>

          <dl>
            <div className="pair">
              <dt>แหล่ง</dt>
              <dd>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.repo}
                </a>{" "}
                · {source.license}
              </dd>
            </div>
            <div className="pair">
              <dt>โดเมน</dt>
              <dd>{skill.domain}</dd>
            </div>
            <div className="pair">
              <dt>สคริปต์</dt>
              <dd>{skill.scripts}</dd>
            </div>
            <div className="pair">
              <dt>อ้างอิง</dt>
              <dd>{skill.references}</dd>
            </div>
            <div className="pair">
              <dt>ขนาด</dt>
              <dd>{formatBytes(skill.bodyBytes)}</dd>
            </div>
            {skill.version && (
              <div className="pair">
                <dt>เวอร์ชัน</dt>
                <dd>{skill.version}</dd>
              </div>
            )}
          </dl>

          <SkillActions skill={skill} source={source} />

          <h2 className="sect">คำสั่งติดตั้งสำหรับ Claude Code</h2>
          <pre className="viewer" lang="en">
            {installCommand(skill, source)}
          </pre>

          <h2 className="sect">SKILL.md</h2>
          <pre className="viewer tall" lang="en">
            {body}
          </pre>
        </div>

        {siblings.length > 0 && (
          <section className="siblings">
            <h2 className="sect">สกิลอื่นในโดเมน {DOMAIN_LABEL[skill.domain] ?? skill.domain}</h2>
            <ul>
              {siblings.map((s) => (
                <li key={s.slug}>
                  <a href={`${BASE}/s/${s.slug}/`}>
                    <b className="mono">{s.name}</b>
                    <span>{s.descriptionTh || s.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="wrap">
        <p>
          เนื้อหาสกิลเป็นของ <a href={source.url}>{source.repo}</a> ภายใต้สัญญาอนุญาต{" "}
          {source.license} เมื่อนำไปใช้ต่อ กรุณาคงเครดิตและสัญญาอนุญาตเดิมไว้
        </p>
      </footer>
    </>
  );
}
