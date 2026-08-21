# 🍽️ ระบบจัดการร้านอาหาร & POS 0 บาท - ครัวลุงหนุ่ย (Krua Lung Nui)

ระบบบริหารจัดการร้านอาหารครบวงจร (All-in-One Restaurant Management Suite) ออกแบบตามสถาปัตยกรรมต้นทุน 0 บาทต่อปี สวยงาม ทันสมัย และแบ่งโครงสร้างอย่างเป็นระเบียบระหว่าง **Frontend** และ **Backend**

---

## 📂 โครงสร้างโฟลเดอร์ของระบบ (System Architecture)

```
restaurant-pos/
│
├── 🌐 frontend/                  # ฝั่งหน้าบ้าน (Web Applications & UI)
│   ├── index.html                # หน้าเว็บรวม (Admin / Cashier / Kitchen KDS / Mobile Order)
│   ├── style.css                 # สไตล์ชีตหลัก & Print Stylesheet
│   ├── app.js                    # จัดการการทำงานหน้าเว็บ & ตะกร้าสินค้า
│   ├── promptpay.js              # ระบบสร้าง Dynamic PromptPay QR Code
│   ├── logo/                     # โลโก้จริงของร้านครัวลุงหนุ่ย
│   │   ├── logo.jpg
│   │   └── logo.png
│   └── images/                   # รูปภาพเมนูอาหารคมชัดตรงปกทั้ง 9 รายการ
│       ├── somtum_thai_egg.jpg   # ส้มตำไทยไข่เค็มทรงเครื่อง
│       ├── somtum_pu_plara.jpg   # ตำปูปลาร้าแซ่บนัว
│       ├── miang_pla_tabtim.jpg  # เมี่ยงปลาทับทิม สูตรเด็ดอร่อยแซ่บ
│       ├── gai_yang.jpg          # ไก่ย่างหอมกลิ่นเตาถ่าน
│       ├── kor_moo_yang.jpg      # คอหมูย่างเตาถ่านน้ำจิ้มแจ่ว
│       ├── tom_saap.jpg          # ต้มแซ่บกระดูกหมูอ่อน
│       ├── pad_krapow_beef.jpg   # ข้าวกะเพราเนื้อโคขุนคั่วพริกแห้ง + ไข่ดาว
│       ├── thai_tea.jpg          # ชาไทยโบราณเย็น
│       └── lod_chong.jpg         # ลอดช่องวัดเจษฯ น้ำกะทิน้ำตาลมะพร้าว
│
├── ⚙️ backend/                   # ฝั่งหลังบ้าน (Server, Database & Automations)
│   ├── db/
│   │   ├── database.json         # ฐานข้อมูลกลาง (JSON Storage)
│   │   └── schema.sql            # โครงสร้างตาราง SQL สำหรับ Supabase / PostgreSQL
│   ├── workflows/
│   │   └── n8n_line_notification_workflow.json  # Workflow ส่งแจ้งเตือนเข้า LINE
│   ├── server.py                 # REST API Server ภาษา Python
│   ├── server.js                 # REST API Server ภาษา Node.js
│   ├── package.json              # ไฟล์ Dependencies สำหรับ Node.js
│   └── README.md                 # คู่มือ API และการต่อระบบหลังบ้าน
│
├── 🚀 run_frontend.bat           # ดับเบิลคลิกเพื่อเปิดหน้าเว็บระบบทันที
├── ⚡ run_backend.bat            # ดับเบิลคลิกเพื่อเปิด Backend API Server (Port 5000)
└── 📄 README.md                  # ภาพรวมระบบ
```

---

## 💡 วิธีการเปิดใช้งาน

1. **เปิดใช้งานหน้าเว็บทันที:**
   * ดับเบิลคลิกที่ไฟล์ **`run_frontend.bat`** หรือเปิดไฟล์ `frontend/index.html` บน Google Chrome / Microsoft Edge
2. **เปิดเซิร์ฟเวอร์หลังบ้าน (API Server):**
   * ดับเบิลคลิกที่ไฟล์ **`run_backend.bat`** เซิร์ฟเวอร์จะเปิดทำงานที่ `http://localhost:5000`
