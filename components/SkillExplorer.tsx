"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  BASE,
  DOMAIN_LABEL,
  PLATFORMS,
  type Lang,
  type Skill,
  describe,
  rawIndex,
  wordIndex,
} from "@/lib/skills";
import { TH2EN, hasThai, parseQuery } from "@/lib/thai";
import SkillDetail from "@/components/SkillDetail";

type Sort = "domain" | "name" | "tools";

export default function SkillExplorer({ skills }: { skills: Skill[] }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("domain");
  const [onlyTools, setOnlyTools] = useState(false);
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const [lang, setLang] = useState<Lang>("th");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0];

  // Search indexes are derived once; the browser never rebuilds them per keystroke.
  const indexes = useMemo(() => {
    const map = new Map<string, { words: string; raw: string }>();
    for (const s of skills) map.set(s.slug, { words: wordIndex(s), raw: rawIndex(s) });
    return map;
  }, [skills]);

  const domains = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of skills) counts.set(s.domain, (counts.get(s.domain) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [skills]);
  const maxDomain = domains[0]?.[1] ?? 1;

  const parsed = useMemo(() => parseQuery(query), [query]);

  const results = useMemo(() => {
    const { concepts, leftover, plain } = parsed;
    let out = skills.filter((s) => {
      if (domain && s.domain !== domain) return false;
      if (onlyTools && !s.scripts) return false;
      if (!concepts.length && !plain) return true;
      const idx = indexes.get(s.slug)!;
      if (plain) return idx.raw.includes(plain);
      for (const synonyms of concepts) {
        if (!synonyms.some((w) => idx.words.includes(` ${w}`))) return false;
      }
      return leftover ? idx.raw.includes(leftover) : true;
    });
    if (sort === "name") out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "tools")
      out = [...out].sort((a, b) => b.scripts - a.scripts || a.name.localeCompare(b.name));
    return out;
  }, [skills, indexes, parsed, domain, onlyTools, sort]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const reset = () => {
    setOpenSlug(null);
  };

  const highlight = parsed.plain || parsed.leftover;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      reset();
    }
  };

  const thaiTerms = parsed.thai.flatMap((k) => TH2EN[k].split(" "));

  return (
    <>
      <div className="controls">
        <div className="wrap controls-in">
          <div className="searchbox">
            <span className="mag" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="7" cy="7" r="4.6" fill="none" />
                <path d="M10.5 10.5 14 14" strokeLinecap="round" />
              </svg>
            </span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              autoComplete="off"
              spellCheck={false}
              placeholder="ค้นหาไทยหรืออังกฤษ เช่น ความปลอดภัย, ฐานข้อมูล, seo…"
              aria-label="ค้นหาสกิล"
              onChange={(e) => {
                setQuery(e.target.value);
                reset();
              }}
              onKeyDown={onKeyDown}
            />
            <kbd>/</kbd>
          </div>

          <select
            className="platform"
            value={platformId}
            aria-label="ปลายทางที่จะเอาสกิลไปใช้"
            onChange={(e) => setPlatformId(e.target.value)}
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                → {p.label}
              </option>
            ))}
          </select>

          <select
            value={lang}
            aria-label="ภาษาของคำอธิบาย"
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            <option value="th">คำอธิบายไทย</option>
            <option value="en">English</option>
            <option value="both">ไทย + English</option>
          </select>

          <select value={sort} aria-label="เรียงลำดับ" onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="domain">เรียงตามโดเมน</option>
            <option value="name">เรียงตามชื่อ A–Z</option>
            <option value="tools">เรียงตามจำนวนสคริปต์</option>
          </select>

          <button
            className="tgl"
            type="button"
            aria-pressed={onlyTools}
            onClick={() => {
              setOnlyTools((v) => !v);
              reset();
            }}
          >
            มีสคริปต์ Python
          </button>

          <button
            className="tgl"
            type="button"
            aria-pressed={vocabOpen}
            onClick={() => setVocabOpen((v) => !v)}
          >
            คำค้นไทย
          </button>

          <p className="count" aria-live="polite">
            แสดง <b className="num">{results.length}</b> / <span className="num">{skills.length}</span>
          </p>
        </div>
      </div>

      <div className="wrap shell">
        <nav className="rail" aria-label="กรองตามโดเมน">
          <h2>โดเมน</h2>
          <ul>
            <RailItem
              label="ทั้งหมด"
              count={skills.length}
              width={100}
              active={domain === null}
              onClick={() => {
                setDomain(null);
                reset();
              }}
            />
            {domains.map(([id, count]) => (
              <RailItem
                key={id}
                label={id}
                count={count}
                width={Math.max(3, Math.round((count / maxDomain) * 100))}
                active={domain === id}
                onClick={() => {
                  setDomain(id);
                  reset();
                }}
              />
            ))}
          </ul>
        </nav>

        <div className="col">
          {vocabOpen && (
            <section className="vocab">
              <h4>คำค้นภาษาไทยที่รองรับ</h4>
              <p>
                คลิกคำเพื่อค้นหาทันที — พิมพ์หลายคำติดกันได้ ระบบจะหาสกิลที่ตรงทุกคำ เช่น{" "}
                <span className="mono">ความปลอดภัย ฐานข้อมูล</span>
              </p>
              <div className="words">
                {Object.keys(TH2EN).map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      setQuery(word);
                      reset();
                      searchRef.current?.focus();
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </section>
          )}

          {parsed.thai.length > 0 && (
            <div className="qmeta">
              <span className="lbl">แปลงคำค้นเป็น</span>
              <span className="terms">
                {thaiTerms.map((term) => (
                  <span key={term}>{term}</span>
                ))}
              </span>
            </div>
          )}

          <main>
            {results.length === 0 ? (
              <div className="empty">
                <b>ไม่พบสกิลที่ตรงกับเงื่อนไข</b>
                {parsed.thai.length
                  ? "ลองใช้คำกว้างขึ้น หรือเลือกโดเมน “ทั้งหมด”"
                  : hasThai(query)
                    ? "คำไทยนี้ยังไม่อยู่ในพจนานุกรม — กดปุ่ม “คำค้นไทย” ด้านบนเพื่อดูคำที่รองรับ"
                    : "ลองลบคำค้น หรือเลือกโดเมน “ทั้งหมด”"}
              </div>
            ) : (
              <Results
                results={results}
                sort={sort}
                highlight={highlight}
                openSlug={openSlug}
                platform={platform}
                lang={lang}
                onToggle={(slug) => setOpenSlug((cur) => (cur === slug ? null : slug))}
                onNotify={notify}
              />
            )}
          </main>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function RailItem({
  label,
  count,
  width,
  active,
  onClick,
}: {
  label: string;
  count: number;
  width: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" aria-current={active} onClick={onClick}>
        <span className="nm">{label}</span>
        <span className="ct num">{count}</span>
      </button>
      <div className="bar">
        <i style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}

function Results({
  results,
  sort,
  highlight,
  openSlug,
  platform,
  lang,
  onToggle,
  onNotify,
}: {
  results: Skill[];
  sort: Sort;
  highlight: string;
  openSlug: string | null;
  platform: (typeof PLATFORMS)[number];
  lang: Lang;
  onToggle: (slug: string) => void;
  onNotify: (message: string) => void;
}) {
  const rows: React.ReactNode[] = [];

  if (sort === "domain") {
    let current: string | null = null;
    for (const skill of results) {
      if (skill.domain !== current) {
        current = skill.domain;
        const count = results.filter((s) => s.domain === current).length;
        rows.push(
          <div className="grouphead" key={`head-${current}`}>
            <h3>{DOMAIN_LABEL[current] ?? current}</h3>
            <span className="slug">{current}/</span>
            <span className="gc">{count} สกิล</span>
          </div>
        );
      }
      rows.push(row(skill));
    }
  } else {
    rows.push(
      <div className="grouphead" key="head-flat">
        <h3>{sort === "name" ? "เรียง A–Z" : "เรียงตามจำนวนสคริปต์"}</h3>
        <span className="gc">{results.length} สกิล</span>
      </div>
    );
    for (const skill of results) rows.push(row(skill));
  }

  return <>{rows}</>;

  function row(skill: Skill) {
    const open = openSlug === skill.slug;
    const text = describe(skill, lang);
    return (
      <div key={skill.slug}>
        <button className="row" type="button" aria-expanded={open} onClick={() => onToggle(skill.slug)}>
          <span>
            <span className="nm">{marked(skill.name, highlight)}</span>
            {skill.group !== skill.domain && (
              <span className="bundle">{skill.group.slice(skill.domain.length + 1)}/</span>
            )}
          </span>
          <span className="dsc">
            <span className="dsc-main">{text.main}</span>
            {text.sub && <span className="dsc-alt">{text.sub}</span>}
          </span>
          <span className="kit">
            {skill.scripts > 0 && <span className="chip py num">{skill.scripts} py</span>}
            {skill.references > 0 && <span className="chip num">{skill.references} ref</span>}
          </span>
        </button>
        {open && <SkillDetail skill={skill} platform={platform} onNotify={onNotify} />}
      </div>
    );
  }
}

function marked(text: string, needle: string) {
  if (!needle) return text;
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

export { BASE };
