# ครัวลุงหนุ่ย (Krua Lung Nui) - Zero-Cost Cloud Restaurant POS & Cost Control System

ระบบบริหารจัดการร้านอาหารครบวงจรสำหรับ **ครัวลุงหนุ่ย** รองรับการสั่งอาหารผ่านมือถือด้วย QR Code ประจำโต๊ะ, หน้าจอแคชเชียร์, หน้าจอพ่อครัว (KDS), ระบบบัญชีควบคุมต้นทุนแบบ Dual-View (Cash Basis & Accrual), และเชื่อมต่อคลาวด์ฐานข้อมูลแบบ Realtime ผ่าน **Supabase**

---

## 🌟 จุดเด่นของระบบ

1. **สถาปัตยกรรมเมนูแบบแยกส่วน (Decoupled Menu Modules):**
   - เมนูทั้ง 43 รายการถูกแยกไฟล์ตามหมวดหมู่ไว้ในโฟลเดอร์ `data/menus/`
   - เมื่อต้องการแก้ไข เพิ่ม หรือเปลี่ยนราคาในหมวดใด สามารถแก้ไขเฉพาะไฟล์นั้นได้ทันที **โดยไม่กระทบกับเมนูอื่นหรือโค้ดหลักของระบบ**
2. **ฐานข้อมูลคลาวด์ Supabase (Project ID: myajcbynabcwfmlvqpwv):**
   - รองรับ Realtime Data Sync ส่งออเดอร์จากมือถือลูกค้าเข้าหน้าจอครัวและแคชเชียร์ทันที
   - มีระบบ **Offline-First Fallback** หากไม่มีอินเทอร์เน็ตหรือยังไม่ต่อ API Key ระบบจะสลับไปทำงานบน Local Database ทันที ร้านอาหารเปิดขายได้ต่อเนื่องไม่มีสะดุด
3. **ระบบบัญชีและควบคุมต้นทุนร้านอาหาร (Accounting & Cost Engine):**
   - มุมมองเงินสด (Cash Basis) ตรวจสอบเงินเข้า-ออกกระเป๋าจริงแบบ Realtime
   - มุมมองเกณฑ์คงค้าง (Accrual Basis) เกลี่ยต้นทุนคงที่รายเดือน (ค่าเช่า/น้ำไฟ) เพื่อคำนวณจุดคุ้มทุน (Break-Even) และกำไรสุทธิที่แท้จริง
   - ตารางติดตามหนี้สินและเงินกู้ (Loan & Debt Ledger)
4. **ความปลอดภัยและการขึ้น GitHub:**
   - คอนฟิกความปลอดภัย `.gitignore` ป้องกันไฟล์ขยะและไฟล์บีบอัดขนาดใหญ่
   - ไม่ฝังรหัสลับ (No Hardcoded Secrets) ใช้รูปแบบ `config.example.js`

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── data/                          # โมดูลข้อมูลแยกส่วน (Single Source of Truth)
│   ├── categories.js              # ข้อมูลหมวดหมู่อาหาร (8 หมวดหมู่)
│   └── menus/                     # โฟลเดอร์แยกไฟล์เมนูอิสระ
│       ├── recommend.js           # 🌟 รายการแนะนำ (3 เมนู)
│       ├── alacarte.js            # 🍳 อาหารตามสั่ง (4 เมนู)
│       ├── isan.js                # 🌶️ อาหารอีสาน ส้มตำ ลาบ ก้อย (15 เมนู)
│       ├── soup_yum.js            # 🍲 อาหารประเภทต้ม ยำ (6 เมนู)
│       ├── drink_promo.js         # 🔥 โปรต้อนรับร้านใหม่ (6 เมนู)
│       ├── alcohol.js             # 🍾 เหล้า & เบียร์ (6 เมนู)
│       ├── mixer.js               # 🧊 น้ำดื่ม & ของผสม (3 เมนู)
│       └── index.js               # รวมทุกหมวดหมู่เป็น Unified Registry (43 รายการ)
├── backend/                       # ระบบบริหารจัดการร้านอาหาร (POS Admin, Cashier, Kitchen)
│   ├── admin.html                 # หน้าจอผู้จัดการร้าน / ตั้งค่า / ระบบบัญชี
│   ├── cashier.html               # หน้าจอแคชเชียร์ รับเงิน ออกบิล
│   ├── kitchen.html               # หน้าจอพ่อครัว (Kitchen KDS) รับออเดอร์ Realtime
│   ├── db/
│   │   ├── supabase_schema.sql    # สคริปต์ SQL ตัวเต็มสำหรับสร้างตารางบน Supabase
│   │   └── database.json          # ฐานข้อมูลสำรอง Local Database
│   ├── js/
│   │   ├── accounting.js          # เครื่องมือคำนวณบัญชีและจุดคุ้มทุน
│   │   ├── supabaseClient.js      # ตัวเชื่อมต่อ Supabase ฝั่งแอดมิน
│   │   └── state.js               # State Management
│   └── images/                    # รูปภาพเมนู 47 รายการ
├── frontend/                      # หน้าเว็บสั่งอาหารสำหรับลูกค้า (Customer Mobile Web App)
│   ├── index.html                 # หน้าร้านสำหรับลูกค้า (บังคับสแกน QR โต๊ะก่อนสั่ง)
│   ├── app.js                     # ตรรกะการทำงานหน้าร้าน
│   ├── supabaseClient.js          # ตัวเชื่อมต่อ Supabase ฝั่งลูกค้า
│   └── images/                    # รูปภาพเมนูสำหรับลูกค้า
├── image/                         # คลังภาพต้นฉบับความละเอียดสูงทั้งหมดของร้าน (53 ไฟล์)
├── richmenu/                      # รูปภาพและคอนฟิก LINE Official Account Rich Menu
├── config.example.js              # แม่แบบไฟล์ตั้งค่า Supabase API Key
├── setup_git_push.bat             # สคริปต์คลิกเดียวเตรียมระบบและ Push ขึ้น GitHub
├── run_admin.bat                  # ปุ่มลัดเปิดหน้าจอผู้จัดการ (Admin)
├── run_cashier.bat                # ปุ่มลัดเปิดหน้าจอแคชเชียร์ (Cashier)
├── run_kitchen.bat                # ปุ่มลัดเปิดหน้าจอครัว (Kitchen)
├── run_frontend.bat               # ปุ่มลัดเปิดหน้าสั่งอาหารของลูกค้า (Frontend)
└── README.md                      # เอกสารคู่มือระบบ
```

---

## 🚀 ขั้นตอนการติดตั้งและเชื่อมโยงฐานข้อมูล Supabase

### ขั้นตอนที่ 1: ติดตั้งตารางและข้อมูลตั้งต้นบน Supabase
1. เข้าสู่ระบบที่ [Supabase Dashboard](https://supabase.com/dashboard/project/myajcbynabcwfmlvqpwv)
2. ไปที่เมนู **SQL Editor** (แท็บรูป `>_` ด้านซ้าย)
3. เปิดไฟล์ `backend/db/supabase_schema.sql` ในโปรเจกต์นี้ คัดลอกเนื้อหาทั้งหมด แล้วนำไปวางใน SQL Editor
4. กดปุ่ม **Run**
   * ระบบจะสร้างตาราง: `shop_settings`, `categories`, `menus`, `tables`, `orders`, `ledger_transactions`, `loan_contracts`
   * ระบบจะบันทึกข้อมูลเมนูอาหารตั้งต้นทั้ง 43 เมนู หมวดหมู่ และโต๊ะอาหารให้อัตโนมัติในทันที
   * ระบบจะเปิดใช้งาน Row Level Security (RLS) และ Supabase Realtime พร้อมใช้งาน

### ขั้นตอนที่ 2: เชื่อมต่อ API Key เข้าสู่ระบบ
1. ในหน้า Supabase Dashboard ไปที่ **Project Settings** -> **API**
2. คัดลอกค่า **Project URL** และ **anon / public key**
3. สร้างไฟล์ชื่อ `config.js` ที่ Root ของโปรเจกต์ (หรือบันทึกผ่านปุ่มตั้งค่าในหน้า `admin.html`) ดังนี้:
```javascript
window.APP_CONFIG = {
  SUPABASE_URL: "https://myajcbynabcwfmlvqpwv.supabase.co",
  SUPABASE_ANON_KEY: "วาง_ANON_KEY_ที่คัดลอกมาที่นี่"
};
```
*(หากยังไม่ได้กรอก Key ระบบจะทำงานในโหมด Offline / Local Database ได้อย่างสมบูรณ์แบบโดยไม่มี Error)*

---

## 🐙 วิธีนำโปรเจกต์ขึ้น GitHub (https://github.com/kenshiro99/Krua-Lung-Nui)

คุณสามารถนำโค้ดขึ้น GitHub ได้ง่ายๆ ผ่าน 2 วิธี:

### วิธีที่ 1: ดับเบิลคลิกไฟล์สคริปต์อัตโนมัติ (แนะนำ)
* ดับเบิลคลิกที่ไฟล์ **`setup_git_push.bat`** ในโฟลเดอร์โปรเจกต์
* ระบบจะทำการตรวจสอบ Git, จัดการ Branch, Stage ไฟล์ทั้งหมดโดยไม่รวมไฟล์ขยะ, ทำการ Commit และ Push ไปยัง Repository `https://github.com/kenshiro99/Krua-Lung-Nui.git` ให้ทันที

### วิธีที่ 2: ใช้คำสั่ง Git ผ่าน Terminal
```bash
git init
git branch -M main
git remote add origin https://github.com/kenshiro99/Krua-Lung-Nui.git
git add .
git commit -m "feat: Krua Lung Nui POS - Modular Menus & Supabase Cloud Integration"
git push -u origin main
```

---

## 📝 วิธีแก้ไขเมนูอาหารโดยไม่กระทบเมนูอื่น

ระบบแยกไฟล์เมนูไว้ที่โฟลเดอร์ `data/menus/` ชัดเจน:
* **ต้องการแก้เมนูแนะนำ (ต้มเลือดหมู, ข้าวมันไก่, ก๋วยเตี๋ยวหมู):** เปิด `data/menus/recommend.js`
* **ต้องการแก้อาหารตามสั่ง (กะเพราหมู/ไก่/เนื้อ/ทะเล):** เปิด `data/menus/alacarte.js`
* **ต้องการแก้อาหารอีสาน (ส้มตำ, ลาบ, ก้อย, ย่าง):** เปิด `data/menus/isan.js`
* **ต้องการแก้ต้มยำ/ยำ:** เปิด `data/menus/soup_yum.js`
* **ต้องการแก้โปรโมชั่นเครื่องดื่ม:** เปิด `data/menus/drink_promo.js`
* **ต้องการแก้ราคาเหล้า/เบียร์:** เปิด `data/menus/alcohol.js`
* **ต้องการแก้น้ำดื่ม/มิกเซอร์/น้ำแข็ง:** เปิด `data/menus/mixer.js`

เมื่อแก้ไขและบันทึกไฟล์ ข้อมูลจะอัปเดตไปยังทั้งหน้าเว็บลูกค้า (`frontend`) และระบบจัดการหลังบ้าน (`backend`) พร้อมกันทันที
