/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🔥 โปรต้อนรับร้านใหม่ (16.00-21.00) (6 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var DRINK_PROMO_MENUS = [
  {
    "id": "m-pr-1",
    "categoryId": "cat-drink-promo",
    "name": "โปรเบียร์ลีโอ 3 ขวด 230.- (ปกติ 240.-)",
    "description": "สุดคุ้มชุดประหยัด เบียร์ลีโอ 3 ขวดใหญ่ แช่เย็นพร้อมเสิร์ฟ",
    "price": 230,
    "imageUrl": "images/promo_beer_leo_3.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-pr-2",
    "categoryId": "cat-drink-promo",
    "name": "โปรเบียร์ช้าง 3 ขวด 230.- (ปกติ 240.-)",
    "description": "โปรโมชั่นสุดคุ้ม เบียร์ช้างคลาสสิก 3 ขวดใหญ่ เย็นสะใจ",
    "price": 230,
    "imageUrl": "images/promo_beer_chang_3.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-pr-3",
    "categoryId": "cat-drink-promo",
    "name": "โปรเบียร์สิงห์ 3 ขวด 260.- (ปกติ 270.-)",
    "description": "โปรโมชั่นสิงห์ 3 ขวดใหญ่ รสชาติเข้มข้น ดื่มด่ำทุกช่วงเวลา",
    "price": 260,
    "imageUrl": "images/promo_beer_singha_3.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-dp-1",
    "categoryId": "cat-drink-promo",
    "name": "โปรเบียร์สิงห์ 2 ขวด (โปรต้อนรับร้านใหม่)",
    "description": "เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)",
    "price": 99,
    "imageUrl": "images/promo_beer_singha.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-dp-2",
    "categoryId": "cat-drink-promo",
    "name": "เบียร์ช้าง หรือ ลีโอ 2 ขวด (โปรต้อนรับร้านใหม่)",
    "description": "เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)",
    "price": 89,
    "imageUrl": "images/promo_beer_chang_leo.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-dp-3",
    "categoryId": "cat-drink-promo",
    "name": "เบลนด์ 285 ขวดลิตร (โปรต้อนรับร้านใหม่)",
    "description": "แถมฟรีโซดา 4 ขวด และน้ำแข็ง 1 ถัง + แถมฟรีเฟรนช์ฟรายส์ 1 จาน (เสิร์ฟช่วง 16.00–21.00 น. จำกัดโต๊ะละ 1 ชุด)",
    "price": 350,
    "imageUrl": "images/promo_blend285.jpg",
    "options": "",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DRINK_PROMO_MENUS;
}
if (typeof window !== 'undefined') {
  window.DRINK_PROMO_MENUS = DRINK_PROMO_MENUS;
}
