# 🛠️ ครัวลุงหนุ่ย - Backend & API Documentation

โฟลเดอร์นี้รวบรวมระบบหลังบ้าน (Backend Server), ฐานข้อมูล (Database), โครงสร้าง SQL (Schema) และระบบ Automation แจ้งเตือนเข้า LINE สำหรับร้านอาหาร **ครัวลุงหนุ่ย**

---

## 📂 โครงสร้างภายในโฟลเดอร์ Backend

```
backend/
├── db/
│   ├── database.json        # ฐานข้อมูลกลาง (Menus, Tables, Orders, Settings)
│   └── schema.sql           # โครงสร้าง SQL สำหรับต่อกับ Supabase / PostgreSQL ฟรีตลอดชีพ
├── workflows/
│   └── n8n_line_notification_workflow.json  # Workflow ส่งออเดอร์เข้า LINE กลุ่มพนักงาน
├── server.py                # REST API Server ภาษา Python (ไม่ต้องลง Node ก็รันได้ทันที)
├── server.js                # REST API Server ภาษา Node.js Express
├── package.json             # ไฟล์ Dependencies สำหรับ Node.js
└── README.md                # คู่มือการใช้งานระบบหลังบ้าน
```

---

## 🚀 วิธีการรัน Backend API Server

### ทางเลือกที่ 1: รันด้วย Python (แนะนำ - เร็วและง่ายที่สุด)
เปิด Terminal หรือ Command Prompt ในโฟลเดอร์ `backend` แล้วรัน:
```bash
python server.py
```
* API Server จะทำงานที่: `http://localhost:5000`

### ทางเลือกที่ 2: รันด้วย Node.js
```bash
npm install
npm start
```
* API Server จะทำงานที่: `http://localhost:5000`

---

## 📡 รายการ REST API Endpoints

| Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- |
| **GET** | `/api/status` | ตรวจสอบสถานะความพร้อมของเซิร์ฟเวอร์ |
| **GET** | `/api/menus` | ดึงรายการเมนูอาหารทั้งหมด |
| **GET** | `/api/categories` | ดึงหมวดหมู่อาหาร |
| **GET** | `/api/tables` | ดึงสถานะโต๊ะทั้งหมด |
| **GET** | `/api/orders` | ดึงรายการคำสั่งซื้อทั้งหมด |
| **POST** | `/api/orders` | บันทึกออเดอร์ใหม่ (จากการสแกนสั่งของลูกค้า) |
| **POST** | `/api/checkout` | เช็คบิล & ปิดโต๊ะ |
| **GET/POST** | `/api/settings` | ดึงหรือบันทึกการตั้งค่าร้าน & พร้อมเพย์ |

---

## ☁️ การนำขึ้น Cloud ฟรี (Zero-Cost Hosting & Database)

1. **ฐานข้อมูลคลาวด์:** นำไฟล์ `db/schema.sql` ไปรันใน **Supabase (Free Tier)** เพื่อใช้งาน PostgreSQL แบบ Real-time ทันที
2. **ระบบแจ้งเตือน LINE:** นำไฟล์ `workflows/n8n_line_notification_workflow.json` ไป Import ใน **n8n** เพื่อยิงข้อความเข้ากลุ่ม LINE พนักงานอัตโนมัติ
