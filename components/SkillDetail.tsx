"use client";

import { useEffect, useState } from "react";
import {
  BASE,
  type Platform,
  type Skill,
  type Source,
  formatBytes,
  installCommand,
  portablePrompt,
} from "@/lib/skills";
import { cachedBody, copyText, loadBody } from "@/lib/copy";

export default function SkillDetail({
  skill,
  source,
  platform,
  onNotify,
}: {
  skill: Skill;
  source: Source;
  platform: Platform;
  onNotify: (message: string) => void;
}) {
  const [body, setBody] = useState<string | null>(cachedBody(skill.slug) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const ready = cachedBody(skill.slug);
    if (ready !== undefined) {
      setBody(ready);
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
      const text = portablePrompt(skill, body ?? (await loadBody(skill.slug)), source);
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
    const ok = await copyText(installCommand(skill, source));
    onNotify(ok ? "คัดลอกคำสั่งติดตั้งแล้ว" : "คัดลอกอัตโนมัติไม่ได้");
  };

  const promptSize = body ? formatBytes(portablePrompt(skill, body, source).length) : "…";

  return (
    <div className="detail">
      <div className="detail-top">
        <div className="path">{skill.path}</div>
        <a className="full" href={`${BASE}/s/${skill.slug}/`}>
          เปิดหน้าเต็ม ↗
        </a>
      </div>

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
