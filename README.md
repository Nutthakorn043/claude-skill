# Claude Skills Index

หน้าเว็บไฟล์เดียวสำหรับค้นหา กรอง และคัดลอกสกิลทั้งหมดจากคลัง
[alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
ไปใช้กับ Claude Code, Claude.ai, ChatGPT หรือ Gemini

## ทำอะไรได้

- **ค้นหาสด** จากชื่อสกิล คำอธิบาย และพาธไฟล์ (กด `/` เพื่อโฟกัสช่องค้นหา, `Esc` เพื่อล้าง)
- **กรองตามโดเมน** ทั้ง 20 โดเมน พร้อมจำนวนและแถบสัดส่วน
- **เรียงได้ 3 แบบ** — ตามโดเมน / ชื่อ A–Z / จำนวนสคริปต์ Python
- **คัดลอกไปใช้ต่อ** เลือกปลายทางได้ 4 แบบ
  - `Claude Code` → คัดลอกคำสั่ง `cp -r` สำหรับติดตั้งลง `~/.claude/skills/` (ติดตั้งถาวร)
  - `Claude.ai` / `ChatGPT` / `Gemini` → คัดลอกเนื้อหาสกิลทั้งไฟล์ในรูป prompt พร้อมวางลงช่อง Instructions ของ Project, Custom GPT หรือ Gem
- **ดู `SKILL.md` ดิบ** ได้ในหน้าเลย ไม่ต้องเปิดไฟล์

เนื้อหา `SKILL.md` ทุกไฟล์ฝังอยู่ในหน้าเดียว ไม่มีการเรียก API ภายนอก เปิดจากไฟล์ในเครื่องก็ใช้ได้

## ข้อจำกัดที่ต้องรู้

การวาง prompt ในแชท **ไม่ใช่การติดตั้งถาวร** — มันคือการโหลดคำสั่งเข้า context ของบทสนทนาหรือของ Project นั้นเท่านั้น
การติดตั้งถาวรจริงมีเฉพาะฝั่ง Claude Code (คัดลอกโฟลเดอร์ลง `~/.claude/skills/`)

สกิลหลายตัวมาพร้อมสคริปต์ Python และเอกสารอ้างอิงที่ **ไม่ได้รวมอยู่ใน prompt ที่คัดลอก**
prompt จะแนบหมายเหตุบอกโมเดลไว้ให้แล้วว่าถ้าเจอคำสั่งให้รัน `python scripts/...` ให้วิเคราะห์เองแทน
ถ้าต้องการเครื่องมือครบต้องติดตั้งแบบคัดลอกโฟลเดอร์

## Build ใหม่

`index.html` ถูก commit ไว้แล้ว ใช้งานได้ทันทีโดยไม่ต้อง build
ถ้าคลังต้นทางอัปเดตแล้วอยากสร้างหน้าใหม่:

```bash
git clone https://github.com/alirezarezvani/claude-skills.git
python build.py claude-skills
```

ต้องใช้ Python 3.7+ เท่านั้น ไม่มี dependency ภายนอก
สคริปต์จะสแกน `SKILL.md` ทุกไฟล์ (ข้าม mirror tree `.codex/ .gemini/ .vibe/ .hermes/` ที่เป็นสำเนาซ้ำ)
แล้วฉีดข้อมูลลง `template.html` พร้อมอัปเดตตัวเลขสถิติบนหัวหน้าอัตโนมัติ

```
build.py        สคริปต์ build (stdlib ล้วน)
template.html   เทมเพลตหน้าเว็บ มี placeholder __SKILLS_JSON__
index.html      ผลลัพธ์ที่ build แล้ว — ไฟล์ที่เว็บเสิร์ฟจริง
.nojekyll       บอก GitHub Pages ไม่ต้องประมวลผลด้วย Jekyll
```

## Deploy ด้วย GitHub Pages

push ขึ้น repo แล้วเปิด **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**
หน้าเว็บจะขึ้นที่ `https://<username>.github.io/<repo>/`

ไฟล์ `index.html` ขนาดราว 3.5 MB แต่ GitHub Pages ส่งแบบ gzip ทำให้เหลือประมาณ 1 MB บนสาย

## เครดิตและสัญญาอนุญาต

เนื้อหาสกิลทั้งหมดเป็นผลงานของ [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
เผยแพร่ภายใต้สัญญาอนุญาต MIT — ดูรายละเอียดใน [LICENSE](LICENSE)
