# ย้ายไป claudezillar-skills.is-a.dev

ไฟล์ในโฟลเดอร์นี้ไม่ได้ถูกใช้ตอน build — เก็บไว้เป็นบันทึกว่าส่งอะไรไปที่
[is-a-dev/register](https://github.com/is-a-dev/register) และต้องทำอะไรต่อ

## ทำไมต้องทำตามลำดับ

`next.config.mjs` ตั้ง `basePath: "/claude-skill"` เพราะตอนนี้เว็บอยู่ที่
`nutthakorn043.github.io/claude-skill/` พอย้ายไปโดเมนของตัวเอง เว็บจะอยู่ที่
**ราก** ของโดเมนแทน `basePath` จึงต้องเปลี่ยนเป็นค่าว่าง

ถ้าเปลี่ยน `basePath` ก่อนที่โดเมนจะพร้อม เว็บปัจจุบันจะพังทันที
(ไฟล์ JS/CSS จะถูกอ้างจากราก ซึ่งไม่มีอยู่ใต้ path `/claude-skill/`)
เพราะงั้นต้องทำเรียงตามนี้เท่านั้น

## ขั้นตอน

### 1. เปิด PR ที่ is-a-dev/register

fork repo แล้วเพิ่มไฟล์ `domains/claudezillar-skills.json` ด้วยเนื้อหาจาก
[`claudezillar-skills.json`](claudezillar-skills.json) ในโฟลเดอร์นี้ แล้วเปิด PR

รอทีมงานรีวิวและ merge — ปกติไม่กี่ชั่วโมงถึงไม่กี่วัน

### 2. หลัง PR ถูก merge แล้วเท่านั้น

แก้ 2 อย่างพร้อมกันแล้ว push

- `next.config.mjs` → `basePath = ""`
- เพิ่มไฟล์ `public/CNAME` เนื้อหาบรรทัดเดียว: `claudezillar-skills.is-a.dev`

### 3. ตั้งค่าใน GitHub

**Settings → Pages → Custom domain** ใส่ `claudezillar-skills.is-a.dev` แล้ว Save

รอใบรับรอง HTTPS ออก (ไม่กี่นาทีถึงราวชั่วโมง) แล้วติ๊ก **Enforce HTTPS**

### 4. ตรวจสอบ

เปิด <https://claudezillar-skills.is-a.dev> — ต้องขึ้นหน้าเว็บ ไม่ใช่ 404
และกดเปิดสกิลสักตัวเพื่อดูว่าดึงเนื้อหาจาก `/data/body/*.json` ได้

URL เดิม `nutthakorn043.github.io/claude-skill/` จะ redirect มาที่โดเมนใหม่ให้เอง

## หมายเหตุ

is-a.dev ให้บริการฟรีโดยอาสาสมัคร ไม่มีการรับประกันความต่อเนื่อง
ถ้าโดเมนนี้ล่มหรือถูกยกเลิก ให้ย้อน `basePath` กลับเป็น `/claude-skill`
แล้วลบ `public/CNAME` เว็บจะกลับมาที่ URL เดิมของ GitHub Pages
