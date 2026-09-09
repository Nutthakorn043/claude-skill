"use client";

import { useCallback, useRef, useState } from "react";
import { PLATFORMS, type Skill, type Source, installCommand, portablePrompt } from "@/lib/skills";
import { copyText, loadBody } from "@/lib/copy";

/**
 * Copy buttons for a standalone skill page. The body is fetched on click rather
 * than passed in as a prop: the page already ships it once inside the <pre>,
 * and serialising it a second time would double every page's weight.
 */
export default function SkillActions({ skill, source }: { skill: Skill; source: Source }) {
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? PLATFORMS[0];

  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const copyInstall = async () => {
    const ok = await copyText(installCommand(skill, source));
    notify(ok ? "คัดลอกคำสั่งติดตั้งแล้ว" : "คัดลอกอัตโนมัติไม่ได้");
  };

  const copyPrompt = async () => {
    setBusy(true);
    try {
      const ok = await copyText(portablePrompt(skill, await loadBody(skill.slug), source));
      notify(
        ok
          ? `คัดลอกสกิลแล้ว — ไปวางใน ${platform.label} ได้เลย`
          : "คัดลอกอัตโนมัติไม่ได้ — เลือกข้อความจาก SKILL.md ด้านล่างแทน"
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="acts">
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

        {platform.install && (
          <button className="btn primary" type="button" onClick={copyInstall}>
            คัดลอกคำสั่งติดตั้ง
          </button>
        )}
        <button
          className={platform.install ? "btn" : "btn primary"}
          type="button"
          disabled={busy}
          onClick={copyPrompt}
        >
          คัดลอกเป็น prompt
        </button>
      </div>

      <p className="hint">
        <span>{platform.label}</span>
        <span>{platform.hint}</span>
      </p>

      <div className="toast-slot" role="status" aria-live="polite">
        {toast && <span className="toast">{toast}</span>}
      </div>
    </>
  );
}
