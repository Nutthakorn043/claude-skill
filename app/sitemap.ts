import type { MetadataRoute } from "next";
import data from "@/data/index.json";
import { SITE_URL, type RawSkill } from "@/lib/skills";

// output: "export" needs the route pinned as static before it will emit a file.
export const dynamic = "force-static";

/** Every skill gets a crawlable URL; the index alone exposed none of them. */
export default function sitemap(): MetadataRoute.Sitemap {
  const skills = data.skills as RawSkill[];
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...skills.map((s) => ({
      url: `${SITE_URL}/s/${s.slug}/`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
