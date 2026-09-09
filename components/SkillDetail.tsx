"use client";

import { useEffect, useState } from "react";
import {
  BASE,
  type Platform,
  type Skill,
  formatBytes,
  installCommand,
  portablePrompt,
} from "@/lib/skills";

/** Bodies are fetched once per skill and kept for the life of the page. */
const cache = new Map<string, string>();

async function loadBody(slug: string): Promise<string> {
  const cached = cache.get(slug);
  if (cached !== undefined) return cached;
  const response = await fetch(`${BASE}/data/body/${slug}.json`);
  if (!response.ok) throw new Error(`โหลดเนื้อหาไม่สำเร็จ (${response.status})`);
  const { body } = (await response.json()) as { body: string };
  cache.set(slug, body);
  return body;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is blocked in some embedded contexts; fall back to a
    // detached textarea, which still works under a user gesture.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export default function SkillDetail({
  skill,
  platform,
  onNotify,
}: {
  skill: Skill;
  platform: Platform;
  onNotify: (message: string) => void;
}) {
  const [body, setBody] = useState<string | null>(cache.get(skill.slug) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (cache.has(skill.slug)) {
      setBody(cache.get(skill.slug)!);
      return;
    }
    loadBody(skill.slug)
      .then((text) => alive && setBody(text))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [skill.slug]);

  const copyPrompt = async () => {
    setBusy(true);
    try {
      const text = portablePrompt(skill, body ?? (await loadBody(skill.slug)));
      const ok = await copyText(text);
      onNotify(
        ok
          ? `คัดลอกสกิลแล้ว — ไปวางใน ${platform.label} ได้เลย`
          : "คัดลอกอัตโนมัติไม่ได้ — กด “ดู SKILL.md” แล้วเลือกข้อความเอง"
      );
    } catch (e) {
      onNotify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyInstall = async () => {
    const ok = await copyText(installCommand(skill));
    onNotify(ok ? "คัดลอกคำสั่งติดตั้งแล้ว" : "คัดลอกอัตโนมัติไม่ได้");
  };

  const promptSize = body ? formatBytes(portablePrompt(skill, body).length) : "…";

  return (
    <div className="detail">
      <div className="path">{skill.path}</div>

      <dl>
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

      <p className="hint">
        <span>{platform.label}</span>
        <span>{platform.hint}</span>
      </p>

      <div className="acts">
        {platform.install ? (
          <>
            <button className="btn primary" type="button" onClick={copyInstall}>
              คัดลอกคำสั่งติดตั้ง
            </button>
            <button className="btn" type="button" onClick={copyPrompt} disabled={busy || !!error}>
              คัดลอกเป็น prompt <span className="sz">{promptSize}</span>
            </button>
          </>
        ) : (
          <button className="btn primary" type="button" onClick={copyPrompt} disabled={busy || !!error}>
            คัดลอกไปวางใน {platform.label} <span className="sz">{promptSize}</span>
          </button>
        )}
        <button
          className="btn"
          type="button"
          onClick={() => setShowSource((v) => !v)}
          disabled={!body}
        >
          {showSource ? "ซ่อน SKILL.md" : "ดู SKILL.md"}
        </button>
      </div>

      {error && <p className="hint">{error}</p>}
      {showSource && body && <pre className="viewer">{body}</pre>}
    </div>
  );
}
