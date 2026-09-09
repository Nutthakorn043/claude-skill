/**
 * Thai search.
 *
 * Every skill name and description in the corpus is English, so a Thai query is
 * rewritten into English terms the corpus actually contains rather than
 * translated literally. Terms were picked from a frequency pass over all 388
 * names and descriptions, so each one matches real content.
 */
export const TH2EN: Record<string, string> = {
  ความปลอดภัย: "security secure threat vulnerab pentest hardening secops",
  ปลอดภัย: "security secure threat hardening",
  ฐานข้อมูล: "database sql postgres schema warehouse",
  ข้อมูล: "data analytics dataset warehouse pipeline",
  วิเคราะห์: "analysis analyze analytics analyzer diagnostic",
  ทดสอบ: "test testing qa coverage playwright",
  ประสิทธิภาพ: "performance optimization optimize latency profiler",
  โค้ด: "code coding refactor codebase",
  รีวิว: "review reviewer critique teardown",
  ตรวจสอบ: "audit auditor validator linter",
  สถาปัตยกรรม: "architecture architect",
  ออกแบบ: "design designer ui ux interface",
  เอกสาร: "document documentation docs markdown",
  อัตโนมัติ: "automation automate scaffolder generator",
  คลาวด์: "cloud aws azure gcp",
  คูเบอร์เนเทส: "kubernetes k8s helm operator container",
  โดคเกอร์: "docker container image",
  เซิร์ฟเวอร์: "server backend infrastructure",
  โครงสร้างพื้นฐาน: "infrastructure terraform provisioning",
  เว็บ: "web frontend html landing browser",
  หน้าเว็บ: "landing page cro html",
  มือถือ: "mobile ios android device aso",
  แอป: "app application store aso",
  ปัญญาประดิษฐ์: "ai llm genai anthropic",
  เอไอ: "ai llm genai anthropic",
  แมชชีนเลิร์นนิง: "ml machine training inference",
  พรอมต์: "prompt prompting",
  เอเจนต์: "agent agentic harness orchestrator",
  บั๊ก: "bug defect incident debug",
  แก้บั๊ก: "fix debug incident troubleshoot",
  ดีพลอย: "deploy deployment release rollout",
  มอนิเตอร์: "observability monitoring slo telemetry",
  แจ้งเตือน: "alert alerting incident notification",
  กลยุทธ์: "strategist positioning moat",
  แผน: "roadmap planner sprint",
  โครงการ: "project jira sprint scrum delivery",
  ทีม: "squad org headcount staffing",
  ประชุม: "meeting agenda standup retro boardroom",
  การตลาด: "marketing campaign demand seo aeo",
  โฆษณา: "ads paid creative adwords",
  เนื้อหา: "content copywriting blog editorial",
  คอนเทนต์: "content copywriting social blog",
  แบรนด์: "brand branding positioning",
  โซเชียล: "social linkedin twitter youtube",
  อีเมล: "email inbox newsletter cold",
  การขาย: "sales deal quota selling",
  ขาย: "sales deal quota selling",
  ลูกค้า: "customer client retention churn onboarding",
  คู่แข่ง: "competitive competitor alternatives",
  ราคา: "pricing price monetiz packaging discount",
  รายได้: "revenue arr mrr monetiz",
  การเงิน: "finance financial valuation dcf cfo",
  งบประมาณ: "budget burn spend forecast",
  สัญญา: "contract agreement proposal redline nda",
  กฎหมาย: "legal counsel litigation",
  กฎระเบียบ: "regulatory gdpr fda mdr hipaa",
  มาตรฐาน: "iso soc2 standard certification",
  คุณภาพ: "quality qms capa",
  ความเสี่ยง: "risk mitigation exposure",
  ผลิตภัณฑ์: "product prd discovery feature",
  ผู้ใช้: "persona usability ux respondent",
  วิจัย: "research literature survey academic",
  ผู้บริหาร: "advisor executive c-suite board",
  ผู้นำ: "leadership founder mentor culture",
  บุคคล: "chro people culture headcount",
  จ้างงาน: "hiring recruit candidate interview",
  สอน: "coach mentor tutor teaching",
  สรุป: "summary summarize digest recap synthesis",
  สไลด์: "slides presentation deck pitch",
  ค้นหา: "search seo retrieval discovery",
  จัดการ: "management manager governance operations",
};

/** Longest terms first so "ฐานข้อมูล" wins over the "ข้อมูล" inside it. */
const KEYS = Object.keys(TH2EN).sort((a, b) => b.length - a.length);

export type ParsedQuery = {
  /** One entry per matched Thai term, each a list of English synonyms. */
  concepts: string[][];
  /** The Thai terms that were recognised, in match order. */
  thai: string[];
  /** Latin text left over after the Thai terms were consumed. */
  leftover: string;
  /** Set when nothing Thai matched: search behaves as a plain substring match. */
  plain: string;
};

export function parseQuery(raw: string): ParsedQuery {
  let rest = raw.trim().toLowerCase();
  const concepts: string[][] = [];
  const thai: string[] = [];

  for (const key of KEYS) {
    if (rest.includes(key)) {
      concepts.push(TH2EN[key].split(" "));
      thai.push(key);
      rest = rest.split(key).join(" ");
    }
  }

  // Leftovers still narrow the search. Thai now counts too: descriptions are
  // translated, so a Thai word outside the vocabulary can match directly.
  const trimmed = rest.replace(/\s+/g, " ").trim();
  const leftover = trimmed.length >= 2 ? trimmed : "";

  return {
    concepts,
    thai,
    leftover,
    plain: concepts.length ? "" : raw.trim().toLowerCase(),
  };
}

export const hasThai = (s: string) => /[฀-๿]/.test(s);
