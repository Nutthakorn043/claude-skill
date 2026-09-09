import data from "@/data/index.json";
import SkillExplorer from "@/components/SkillExplorer";
import type { Skill, Stats } from "@/lib/skills";

export default function Page() {
  const stats = data.stats as Stats;
  const skills = data.skills as Skill[];

  return (
    <>
      <header className="top">
        <div className="wrap mast">
          <div className="mast-id">
            <p className="eyebrow">alirezarezvani / claude-skills · v2.12.0 · MIT</p>
            <h1>ดัชนีสกิลทั้งหมด</h1>
            <p className="sub">
              ค้นหาด้วยภาษาไทยหรืออังกฤษ กรองตามโดเมน และ
              <b>คัดลอกสกิลไปใช้กับ AI ตัวไหนก็ได้</b> — Claude Code, Claude.ai, ChatGPT หรือ Gemini
            </p>
          </div>
          <div className="tally">
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
              <span>สคริปต์</span>
            </div>
            <div>
              <b className="num">{stats.references}</b>
              <span>เอกสารอ้างอิง</span>
            </div>
            <div>
              <b className="num">{stats.plugins}</b>
              <span>ปลั๊กอิน</span>
            </div>
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

      <SkillExplorer skills={skills} />

      <footer className="wrap">
        <p>
          ข้อมูลสแกนจาก <code>SKILL.md</code> ทุกไฟล์ (ไม่รวม mirror tree{" "}
          <code>.codex/ .gemini/ .vibe/ .hermes/</code>) — เนื้อหาสกิลทั้งหมดมาจาก{" "}
          <a href="https://github.com/alirezarezvani/claude-skills">alirezarezvani/claude-skills</a>{" "}
          เผยแพร่ภายใต้สัญญาอนุญาต MIT เมื่อนำไปใช้ต่อ กรุณาคงเครดิตต้นทางไว้
        </p>
      </footer>
    </>
  );
}
