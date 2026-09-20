/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🌟 รายการแนะนำ (3 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var RECOMMEND_MENUS = [
  {
    "id": "m-rec-1",
    "categoryId": "cat-recommend",
    "name": "ต้มเลือดหมู",
    "description": "น้ำซุปหอมหวานกระดูกหมู เลือดหมูนุ่ม หมูสับก้อน หมูชิ้น ตำลึงสด โรยกระเทียมเจียวหอมกรุ่น",
    "price": 50,
    "imageUrl": "images/tom_luead_moo.jpg",
    "options": "ใส่ทุกอย่าง, ไม่ใส่เครื่องใน, เพิ่มข้าวสวย (+10), พิเศษ (+10)",
    "isAvailable": true
  },
  {
    "id": "m-rec-2",
    "categoryId": "cat-recommend",
    "name": "ข้าวมันไก่",
    "description": "ข้าวมันหอมนุ่มเม็ดสวย ไก่ตอนเนื้อฉ่ำนุ่ม น้ำจิ้มเต้าเจี้ยวขิงสูตรเด็ด เสิร์ฟคู่น้ำซุปร้อนๆ",
    "price": 50,
    "imageUrl": "images/khao_man_gai.jpg",
    "options": "เนื้ออก, เนื้อสะโพก, เนื้อน่อง, พิเศษ (+10)",
    "isAvailable": true
  },
  {
    "id": "m-rec-3",
    "categoryId": "cat-recommend",
    "name": "ก๋วยเตี๋ยวหมู",
    "description": "ก๋วยเตี๋ยวหมูน้ำใสกลมกล่อม หมูแดง หมูสับ ลูกชิ้นหมู เกี๊ยวกรอบ โรยถั่วลิสงคั่วหอม",
    "price": 50,
    "imageUrl": "images/kuay_tiew_moo.jpg",
    "options": "เส้นเล็ก, เส้นใหญ่, เส้นหมี่ขาว, บะหมี่เหลือง, พิเศษ (+10)",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RECOMMEND_MENUS;
}
if (typeof window !== 'undefined') {
  window.RECOMMEND_MENUS = RECOMMEND_MENUS;
}
