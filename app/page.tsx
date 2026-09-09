import data from "@/data/index.json";
import SkillExplorer from "@/components/SkillExplorer";
import { type RawSkill, type Source, type Stats, toSkill } from "@/lib/skills";

export default function Page() {
  const stats = data.stats as Stats;
  const skills = (data.skills as RawSkill[]).map(toSkill);
  const sources = data.sources as Source[];

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="mast">
            <p className="eyebrow">ดัชนีรวมจากหลายคลัง · อัปเดตอัตโนมัติ</p>
            <h1>ดัชนีสกิลทั้งหมด</h1>
            <p className="sub">
              รวมสกิลจาก {stats.sources} คลัง ค้นหาด้วยภาษาไทยหรืออังกฤษ แล้ว
              <b>คัดลอกไปใช้ได้ทันที</b> ทั้ง <span className="nb">Claude Code</span>,{" "}
              <span className="nb">Claude.ai</span>, ChatGPT และ Gemini
            </p>
          </div>
        </div>
        <div className="wrap statbar">
          <div>
            <b className="num">{stats.skills}</b>
            <span>สกิล</span>
          </div>
          <div>
            <b className="num">{stats.domains}</b>
            <span>โดเมน</span>
          </div>
          <div>
            <b className="num">{stats.scripts}</b>
            <span>สคริปต์ Python</span>
          </div>
          <div>
            <b className="num">{stats.references}</b>
            <span>เอกสารอ้างอิง</span>
          </div>
          <div>
            <b className="num">{stats.sources}</b>
            <span>คลังต้นทาง</span>
          </div>
        </div>
      </header>

      <div className="howto">
        <div className="wrap howto-in">
          <p>
            <span className="tag">ติดตั้งถาวร</span>
            <span>
              <b>Claude Code</b> — คัดลอกโฟลเดอร์ลง <code className="mono">~/.claude/skills/</code>{" "}
              สกิลจะถูกเรียกอัตโนมัติทุก session
            </span>
          </p>
          <p>
            <span className="tag">วางในแชท</span>
            <span>
              <b>Claude.ai / ChatGPT / Gemini</b> — วางเนื้อหาสกิลเป็น instructions ของ Project,
              Custom GPT หรือ Gem
            </span>
          </p>
        </div>
      </div>

      <SkillExplorer skills={skills} sources={sources} />

      <footer className="wrap">
        <p>
          ข้อมูลสแกนจาก <code>SKILL.md</code> ทุกไฟล์ในคลังต้นทาง (ไม่รวม mirror tree{" "}
          <code>.codex/ .gemini/ .vibe/ .hermes/</code>) เนื้อหาสกิลเป็นของเจ้าของคลังแต่ละแห่ง
          เมื่อนำไปใช้ต่อ กรุณาคงเครดิตและสัญญาอนุญาตเดิมไว้
        </p>
        <ul className="credits">
          {sources.map((x) => (
            <li key={x.id}>
              <a href={x.url}>{x.repo}</a> · {x.license} · {x.skills} สกิล
              {x.note ? ` — ${x.note}` : ""}
            </li>
          ))}
        </ul>
      </footer>
    </>
  );
}
