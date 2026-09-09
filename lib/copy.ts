"use client";

import { BASE } from "@/lib/skills";

/** Bodies are fetched once per skill and kept for the life of the page. */
const cache = new Map<string, string>();

export async function loadBody(slug: string): Promise<string> {
  const cached = cache.get(slug);
  if (cached !== undefined) return cached;
  const response = await fetch(`${BASE}/data/body/${slug}.json`);
  if (!response.ok) throw new Error(`โหลดเนื้อหาไม่สำเร็จ (${response.status})`);
  const { body } = (await response.json()) as { body: string };
  cache.set(slug, body);
  return body;
}

export function cachedBody(slug: string): string | undefined {
  return cache.get(slug);
}

export async function copyText(text: string): Promise<boolean> {
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
