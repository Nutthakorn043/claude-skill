"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  BASE,
  DOMAIN_LABEL,
  PLATFORMS,
  type Lang,
  type Skill,
  type Source,
  describe,
  rawIndex,
  wordIndex,
} from "@/lib/skills";
import { TH2EN, hasThai, parseQuery } from "@/lib/thai";
import SkillDetail from "@/components/SkillDetail";

type Sort = "domain" | "name" | "tools";

/** Rows added per batch. 506 at once cost 5,206 DOM nodes on first paint. */
const PAGE = 60;

export default function SkillExplorer({
  skills,
  sources,
}: {
  skills: Skill[];
  sources: Source[];
}) {
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("domain");
  const [onlyTools, setOnlyTools] = useState(false);
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const [lang, setLang] = useState<Lang>("th");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The control bar wraps to two rows below ~1240px and to two more on a phone,
  // so every sticky offset under it has to follow its measured height rather
  // than a constant. Anything pinned below reads --bar.
  useEffect(() => {
    const bar = controlsRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const apply = () => root.style.setProperty("--bar", `${Math.round(bar.offsetHeight)}px`);
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    // ResizeObserver only delivers on a rendered frame, so a tab that is
    // resized while hidden would keep a stale offset until it repaints. The
    // resize event and the webfont swap - which reflows the bar on first load -
    // both land without one.
    window.addEventListener("resize", apply);
    document.fonts?.ready.then(apply);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--bar");
    };
  }, []);

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0];
  const sourceById = useMemo(() => new Map(sources.map((x) => [x.id, x])), [sources]);

  // Search indexes are derived once; the browser never rebuilds them per keystroke.
  const indexes = useMemo(() => {
    const map = new Map<string, { words: string; raw: string }>();
    for (const s of skills) map.set(s.slug, { words: wordIndex(s), raw: rawIndex(s) });
    return map;
  }, [skills]);

  const inSource = useMemo(
    () => (sourceId ? skills.filter((s) => s.source === sourceId) : skills),
    [skills, sourceId]
  );

  const domains = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of inSource) counts.set(s.domain, (counts.get(s.domain) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [inSource]);
  const maxDomain = domains[0]?.[1] ?? 1;

  // Keystrokes paint immediately; filtering 506 skills happens against the
  // value React hands over once it has time for it.
  const deferredQuery = useDeferredValue(query);
  const parsed = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);

  const results = useMemo(() => {
    const { concepts, leftover, plain } = parsed;
    let out = inSource.filter((s) => {
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
  }, [inSource, indexes, parsed, domain, onlyTools, sort]);

  const [limit, setLimit] = useState(PAGE);
  const moreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLimit(PAGE);
  }, [results]);

  // The button is the sentinel, so scrolling grows the list and a keyboard or a
  // browser without IntersectionObserver still has something to press.
  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((n) => n + PAGE);
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit, results]);

  const shown = useMemo(() => results.slice(0, limit), [results, limit]);

  // Counted once instead of re-filtering the whole result set per group head.
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of results) counts.set(s.domain, (counts.get(s.domain) ?? 0) + 1);
    return counts;
  }, [results]);

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
      <div className="controls" ref={controlsRef}>
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

          <div className="filters">
            <select
              value={sourceId ?? ""}
              aria-label="แหล่งที่มาของสกิล"
              onChange={(e) => {
                setSourceId(e.target.value || null);
                setDomain(null);
                reset();
              }}
            >
              <option value="">ทุกแหล่ง ({skills.length})</option>
              {sources.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label} ({x.skills})
                </option>
              ))}
            </select>

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

            <select
              value={sort}
              aria-label="เรียงลำดับ"
              onChange={(e) => setSort(e.target.value as Sort)}
            >
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
          </div>

          <p className="count" aria-live="polite">
            แสดง <b className="num">{results.length}</b> / <span className="num">{inSource.length}</span>
          </p>
        </div>
      </div>

      <div className="wrap shell">
        <nav className="rail" aria-label="กรองตามโดเมน">
          <h2>โดเมน</h2>
          <ul>
            <RailItem
              label="ทั้งหมด"
              count={inSource.length}
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
                  : hasThai(deferredQuery)
                    ? "คำไทยนี้ยังไม่อยู่ในพจนานุกรม — กดปุ่ม “คำค้นไทย” ด้านบนเพื่อดูคำที่รองรับ"
                    : "ลองลบคำค้น หรือเลือกโดเมน “ทั้งหมด”"}
              </div>
            ) : (
              <Results
                shown={shown}
                total={results.length}
                groupCounts={groupCounts}
                sort={sort}
                highlight={highlight}
                openSlug={openSlug}
                platform={platform}
                lang={lang}
                sourceById={sourceById}
                showSourceChip={sourceId === null}
                onToggle={(slug) => setOpenSlug((cur) => (cur === slug ? null : slug))}
                onNotify={notify}
              />
            )}

            {limit < results.length && (
              <button className="more" type="button" ref={moreRef} onClick={() => setLimit((n) => n + PAGE)}>
                แสดงเพิ่ม — เหลืออีก <b className="num">{results.length - limit}</b> สกิล
              </button>
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
  shown,
  total,
  groupCounts,
  sort,
  highlight,
  openSlug,
  platform,
  lang,
  sourceById,
  showSourceChip,
  onToggle,
  onNotify,
}: {
  shown: Skill[];
  total: number;
  groupCounts: Map<string, number>;
  sort: Sort;
  highlight: string;
  openSlug: string | null;
  platform: (typeof PLATFORMS)[number];
  lang: Lang;
  sourceById: Map<string, Source>;
  showSourceChip: boolean;
  onToggle: (slug: string) => void;
  onNotify: (message: string) => void;
}) {
  const rows: React.ReactNode[] = [];

  if (sort === "domain") {
    let current: string | null = null;
    for (const skill of shown) {
      if (skill.domain !== current) {
        current = skill.domain;
        const count = groupCounts.get(current) ?? 0;
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
        <span className="gc">{total} สกิล</span>
      </div>
    );
    for (const skill of shown) rows.push(row(skill));
  }

  return <>{rows}</>;

  function row(skill: Skill) {
    const open = openSlug === skill.slug;
    const text = describe(skill, lang);
    return (
      <div key={skill.slug}>
        <div className="rowline">
          <button className="row" type="button" aria-expanded={open} onClick={() => onToggle(skill.slug)}>
            <span>
              <span className="nm">{marked(skill.name, highlight)}</span>
              {skill.bundle && <span className="bundle">{skill.bundle}/</span>}
            </span>
            <span className="dsc">
              <span className="dsc-main">{text.main}</span>
              {text.sub && <span className="dsc-alt">{text.sub}</span>}
            </span>
            <span className="kit">
              {showSourceChip && <span className="chip src">{sourceById.get(skill.source)?.label}</span>}
              {skill.scripts > 0 && <span className="chip py num">{skill.scripts} py</span>}
              {skill.references > 0 && <span className="chip num">{skill.references} ref</span>}
            </span>
          </button>
          <a
            className="perma"
            href={`${BASE}/s/${skill.slug}/`}
            aria-label={`หน้าเต็มของ ${skill.name}`}
          >
            ↗
          </a>
        </div>
        {open && (
          <SkillDetail
            skill={skill}
            source={sourceById.get(skill.source)!}
            platform={platform}
            onNotify={onNotify}
          />
        )}
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
