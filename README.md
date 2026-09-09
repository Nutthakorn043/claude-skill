# Claude Skills Index

เว็บค้นหาและคัดลอกสกิลทั้งหมดจากคลัง
[alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
ไปใช้กับ Claude Code, Claude.ai, ChatGPT หรือ Gemini

**Next.js 16 · React 19 · TypeScript · static export → GitHub Pages**

## ทำอะไรได้

- **ค้นหาภาษาไทยได้** — พิมพ์ `ความปลอดภัย` `ฐานข้อมูล` `คูเบอร์เนเทส` ได้เลย ระบบแปลงเป็นคำอังกฤษที่มีอยู่จริงในข้อมูลแล้วค้นให้ พร้อมแสดงว่าแปลงเป็นคำอะไรบ้าง พิมพ์หลายคำ = ต้องตรงทุกคำ
- **ค้นภาษาอังกฤษ** ยังทำงานแบบ substring เหมือนเดิม พิมพ์ `kube` เจอ `kubernetes-operator`
- **ปุ่ม “คำค้นไทย”** เปิดดูคำที่รองรับทั้งหมด คลิกแล้วค้นทันที
- **กรองตามโดเมน** ทั้ง 20 โดเมน พร้อมจำนวนและแถบสัดส่วน
- **เรียงได้ 3 แบบ** — ตามโดเมน / ชื่อ A–Z / จำนวนสคริปต์ Python
- **คัดลอกไปใช้ต่อ** เลือกปลายทางได้ 4 แบบ
  - `Claude Code` → คำสั่ง `cp -r` ติดตั้งลง `~/.claude/skills/` (ติดตั้งถาวรจริง)
  - `Claude.ai` / `ChatGPT` / `Gemini` → เนื้อหาสกิลทั้งไฟล์ในรูป prompt วางลงช่อง Instructions ของ Project, Custom GPT หรือ Gem
- **ดู `SKILL.md` ดิบ** ได้ในหน้าเลย

## ข้อจำกัดที่ต้องรู้

การวาง prompt ในแชท **ไม่ใช่การติดตั้งถาวร** — คือการโหลดคำสั่งเข้า context ของบทสนทนาหรือ Project นั้นเท่านั้น
ติดตั้งถาวรจริงมีเฉพาะฝั่ง Claude Code

สกิลหลายตัวมาพร้อมสคริปต์ Python และเอกสารอ้างอิงที่ **ไม่ได้รวมอยู่ใน prompt ที่คัดลอก**
prompt แนบหมายเหตุบอกโมเดลไว้ให้แล้วว่าถ้าเจอคำสั่งให้รัน `python scripts/...` ให้วิเคราะห์เองแทน
ถ้าต้องการเครื่องมือครบต้องติดตั้งแบบคัดลอกโฟลเดอร์

## โครงสร้าง

```
app/                หน้าเว็บ (App Router) + globals.css
components/         SkillExplorer (state ทั้งหมด) + SkillDetail (โหลดเนื้อหา + ปุ่มคัดลอก)
lib/skills.ts       type, ปลายทาง, ตัวสร้าง prompt และคำสั่งติดตั้ง
lib/thai.ts         พจนานุกรมไทย→อังกฤษ 71 คำ + ตัวแยกคำค้น
scripts/            build-data.mjs — สแกน SKILL.md แล้วสร้างข้อมูล
data/index.json     metadata ของทุกสกิล (295 KB) ฝังเข้าหน้าตอน build
public/data/body/   เนื้อหา SKILL.md แยกไฟล์ละสกิล ดึงตอนกดเปิดเท่านั้น
```

การแยกข้อมูลคือหัวใจของโครงสร้างนี้ — หน้าแรกโหลดแค่ metadata ส่วนเนื้อหารวม 3.15 MB
จะถูกดึงเฉพาะสกิลที่ผู้ใช้กดเปิดจริง และ cache ไว้ตลอดอายุหน้า

## รันในเครื่อง

```bash
npm install
npm run dev
```

เปิด <http://localhost:3000/claude-skill/> — ต้องมี `/claude-skill/` ต่อท้ายเพราะ `basePath`
ถูกตั้งไว้ให้ตรงกับตอน deploy จะได้ไม่มีความต่างระหว่าง local กับของจริง

## อัปเดตข้อมูลเมื่อคลังต้นทางเปลี่ยน

```bash
git clone https://github.com/alirezarezvani/claude-skills.git ../claude-skills-main
npm run data
```

ใช้ Node เท่านั้น ไม่มี dependency ภายนอก
สคริปต์ข้าม mirror tree `.codex/ .gemini/ .vibe/ .hermes/` ที่เป็นสำเนาซ้ำ
และคำนวณตัวเลขสถิติบนหัวหน้าจาก tree จริง ไม่ได้ hardcode

ข้อมูลที่ได้ถูก commit ลง repo ทำให้ CI build ได้โดยไม่ต้อง clone คลังต้นทาง

## Deploy

push ขึ้น `main` แล้ว GitHub Actions (`.github/workflows/deploy.yml`) จะ build และ deploy ให้เอง

ครั้งแรกต้องตั้งค่า **Settings → Pages → Source: GitHub Actions** เสียก่อน

> ⚠️ `basePath` ใน `next.config.mjs` ตั้งเป็น `/claude-skill` ตายตัวตามชื่อ repo
> ถ้าเปลี่ยนชื่อ repo ต้องแก้ค่านี้ตามด้วย ไม่งั้น CSS กับ JS จะโหลดไม่ขึ้น

## เครดิตและสัญญาอนุญาต

เนื้อหาสกิลทั้งหมดเป็นผลงานของ [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
เผยแพร่ภายใต้สัญญาอนุญาต MIT — ดูรายละเอียดใน [LICENSE](LICENSE)
