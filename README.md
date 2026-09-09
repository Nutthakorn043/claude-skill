# Claude Skills Index

เว็บค้นหาและคัดลอกสกิลจาก **หลายคลังต้นทาง** ไปใช้กับ Claude Code, Claude.ai,
ChatGPT หรือ Gemini

**Next.js 16 · React 19 · TypeScript · static export → GitHub Pages**

## ทำอะไรได้

- **ค้นหาภาษาไทยได้** — พิมพ์ `ความปลอดภัย` `ฐานข้อมูล` `คูเบอร์เนเทส` ได้เลย ระบบแปลงเป็นคำอังกฤษที่มีอยู่จริงในข้อมูลแล้วค้นให้ พร้อมแสดงว่าแปลงเป็นคำอะไรบ้าง พิมพ์หลายคำ = ต้องตรงทุกคำ
- **ค้นภาษาอังกฤษ** ยังทำงานแบบ substring เหมือนเดิม พิมพ์ `kube` เจอ `kubernetes-operator`
- **ปุ่ม “คำค้นไทย”** เปิดดูคำที่รองรับทั้งหมด คลิกแล้วค้นทันที
- **กรองตามคลังต้นทาง** และ **กรองตามโดเมน** พร้อมจำนวนและแถบสัดส่วน
- **เรียงได้ 3 แบบ** — ตามโดเมน / ชื่อ A–Z / จำนวนสคริปต์ Python
- **คัดลอกไปใช้ต่อ** เลือกปลายทางได้ 4 แบบ
  - `Claude Code` → คำสั่งติดตั้งลง `~/.claude/skills/` แบบครบในตัว (clone คลังต้นทางให้เอง รันจากที่ไหนก็ได้)
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
app/                    หน้าเว็บ (App Router) + globals.css
components/             SkillExplorer (state) + SkillDetail (โหลดเนื้อหา + ปุ่มคัดลอก)
lib/skills.ts           type, ปลายทาง, ตัวสร้าง prompt และคำสั่งติดตั้งต่อคลัง
lib/thai.ts             พจนานุกรมไทย→อังกฤษ + ตัวแยกคำค้น
data/sources.json       รายชื่อคลังต้นทาง — ไฟล์เดียวที่ต้องแก้เมื่อเพิ่มคลังใหม่
data/th.json            คำแปลไทย คีย์ด้วย slug
data/index.json         metadata ของทุกสกิล ฝังเข้าหน้าตอน build
public/data/body/       เนื้อหา SKILL.md แยกไฟล์ละสกิล ดึงตอนกดเปิดเท่านั้น
scripts/fetch-sources.mjs   clone หรืออัปเดตคลังต้นทางลง sources/
scripts/build-data.mjs      สแกนทุกคลังแล้วสร้างข้อมูล
scripts/merge-th.mjs        รวมคำแปลไทยเป็นชุด
```

การแยกข้อมูลคือหัวใจของโครงสร้างนี้ — หน้าแรกโหลดแค่ metadata ส่วนเนื้อหารวม 4 MB
จะถูกดึงเฉพาะสกิลที่ผู้ใช้กดเปิดจริง และ cache ไว้ตลอดอายุหน้า

## รันในเครื่อง

```bash
npm install
npm run dev
```

เปิด <http://localhost:3000/claude-skill/> — ต้องมี `/claude-skill/` ต่อท้ายเพราะ `basePath`
ถูกตั้งไว้ให้ตรงกับตอน deploy จะได้ไม่มีความต่างระหว่าง local กับของจริง

## เพิ่มคลังสกิลใหม่

1. เพิ่มรายการใน [`data/sources.json`](data/sources.json)

```json
{
  "id": "financial-services",
  "label": "Financial Services",
  "repo": "anthropics/financial-services",
  "url": "https://github.com/anthropics/financial-services",
  "license": "Apache-2.0",
  "branch": "main",
  "note": "สกิลสายการเงินอย่างเป็นทางการจาก Anthropic"
}
```

2. ดึงและสร้างข้อมูลใหม่

```bash
npm run sources && npm run data
```

3. commit แล้ว push — GitHub Actions จะ deploy ให้เอง

`id` ถูกใช้เป็น prefix ของ slug ทุกสกิลในคลังนั้น คลังสองแห่งจึงมีสกิลชื่อซ้ำกันได้
`license` และ `repo` ไปโผล่ในเครดิตท้ายหน้า ในคำสั่งติดตั้ง และในหัว prompt ที่คัดลอก
ดังนั้นต้องกรอกให้ตรงกับคลังจริง

คลังต้นทางต้องใช้ธรรมเนียม `SKILL.md` ที่มี YAML frontmatter `name` และ `description`
สคริปต์ข้าม mirror tree `.codex/ .gemini/ .vibe/ .hermes/` ที่เป็นสำเนาซ้ำ

## อัปเดตเมื่อคลังต้นทางเปลี่ยน

```bash
npm run sources && npm run data
```

โฟลเดอร์ `sources/` เป็น shallow clone และถูก gitignore ไว้
ส่วนข้อมูลที่สร้างแล้วถูก commit ลง repo ทำให้ CI build ได้โดยไม่ต้อง clone คลังต้นทาง

## คำแปลไทย

`data/th.json` คีย์ด้วย slug ของสกิล รายการที่ยังไม่แปลจะแสดงภาษาอังกฤษแทนโดยอัตโนมัติ
เว็บจึงถูกต้องเสมอแม้แปลยังไม่ครบ เพิ่มคำแปลเป็นชุดได้ด้วย

```bash
node scripts/merge-th.mjs batch.json
```

สคริปต์จะปฏิเสธ slug ที่ไม่มีอยู่จริงและคำแปลที่สั้นผิดปกติ

## Deploy

push ขึ้น `main` แล้ว GitHub Actions (`.github/workflows/deploy.yml`) จะ build และ deploy ให้เอง

ครั้งแรกต้องตั้งค่า **Settings → Pages → Source: GitHub Actions** เสียก่อน

> ⚠️ `basePath` ใน `next.config.mjs` ตั้งเป็น `/claude-skill` ตายตัวตามชื่อ repo
> ถ้าเปลี่ยนชื่อ repo ต้องแก้ค่านี้ตามด้วย ไม่งั้น CSS กับ JS จะโหลดไม่ขึ้น

## เครดิตและสัญญาอนุญาต

เนื้อหาสกิลเป็นของเจ้าของคลังต้นทางแต่ละแห่ง ตามที่ระบุใน `data/sources.json`
และแสดงไว้ท้ายหน้าเว็บ — ดูรายละเอียดใน [LICENSE](LICENSE)

เมื่อเพิ่มคลังใหม่ ต้องตรวจว่าสัญญาอนุญาตของคลังนั้นอนุญาตให้เผยแพร่ต่อได้
และเพิ่มประกาศลิขสิทธิ์ของคลังนั้นลงใน `LICENSE`
