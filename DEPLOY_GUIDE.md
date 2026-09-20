# 🚀 คู่มือการนำระบบครัวลุงหนุ่ยขึ้นเว็บโฮสติ้ง (Hosting Deployment Guide)

ระบบร้านอาหาร **ครัวลุงหนุ่ย (Krua Lung Nui)** ถูกจัดโครงสร้างแบบ **Hosting-Ready (100% Client-Side + Static / REST API Ready)** สามารถนำขึ้นโฮสติ้งได้หลากหลายรูปแบบทั้ง **ฟรีและจ่ายเงิน** ภายในเวลาไม่ถึง 2 นาทีครับ!

---

## 🌟 ทางเลือกที่ 1: นำขึ้น Vercel (แนะนำที่สุด - ฟรี 100%, เร็วระดับโลก, มี HTTPS ทันที)

1. เข้าเว็บ [vercel.com](https://vercel.com) แล้วสมัคร/เข้าสู่ระบบ
2. กดปุ่ม **"Add New..."** ➔ **"Project"**
3. ลากโฟลเดอร์ `restaurant-pos` หรืออัปโหลดไฟล์จาก GitHub
4. กดปุ่ม **"Deploy"** ➔ ระบบจะสร้างลิงก์เว็บไซต์ให้ทันที เช่น `https://krua-lung-nui.vercel.app` 🎉

---

## 🌟 ทางเลือกที่ 2: นำขึ้น Netlify (ฟรี 100% - แค่ลากวางไฟล์)

1. เข้าเว็บ [app.netlify.com/drop](https://app.netlify.com/drop)
2. ลากโฟลเดอร์ `restaurant-pos` ทั้งโฟลเดอร์ไปวางในกรอบสี่เหลี่ยมบนหน้าจอ
3. ภายใน 5 วินาที คุณจะได้ลิงก์เว็บไซต์ใช้งานจริงพร้อม SSL ทันที!

---

## 🌟 ทางเลือกที่ 3: นำขึ้น cPanel / DirectAdmin / Shared Hosting

1. ล็อกอินเข้าสู่ **cPanel / DirectAdmin** ของโฮสติ้งของคุณ
2. เข้าไปที่เมนู **File Manager** ➔ เข้าโฟลเดอร์ `public_html/`
3. อัปโหลดไฟล์ `restaurant-pos-package.zip` ขึ้นไป
4. คลิกขวาที่ไฟล์ ZIP แล้วเลือก **"Extract"** (แตกไฟล์)
5. เปิดเบราว์เซอร์เข้าสู่ `https://your-domain.com` ใช้งานได้ทันที!

---

## 🌟 ทางเลือกที่ 4: รันผ่าน Node.js Server หรือ Python Flask บน VPS

### Node.js:
```bash
cd backend
npm install
npm start
```

### Python:
```bash
cd backend
pip install -r requirements.txt   # หรือ pip install flask flask-cors
python server.py
```

---

## 📍 แผนผังหน้าเว็บไซต์เมื่อเปิดใช้งานบนโฮสติ้ง:

* **หน้าแรกพอร์ทัลกลาง:** `https://your-domain.com/`
* **ลูกค้าสแกนสั่งที่โต๊ะ (เช่น โต๊ะ 1):** `https://your-domain.com/frontend/index.html?table=1`
* **ลูกค้าสแกนสั่งกลับบ้าน:** `https://your-domain.com/frontend/index.html?type=takeaway`
* **ล็อกอินแยกแผนก:** `https://your-domain.com/backend/login.html`
* **หน้าจอผู้จัดการ (Admin):** `https://your-domain.com/backend/admin.html`
* **หน้าจอแคชเชียร์ (POS):** `https://your-domain.com/backend/cashier.html`
* **หน้าจอทำอาหารในครัว (KDS):** `https://your-domain.com/backend/kitchen.html`
