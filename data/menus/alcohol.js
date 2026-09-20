/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🍾 เหล้า & เบียร์ (6 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var ALCOHOL_MENUS = [
  {
    "id": "m-lq-1",
    "categoryId": "cat-alcohol",
    "name": "เบลนด์ 285 (Blend 285)",
    "description": "สุราผสมกลิ่นวิสกี้ รสนุ่ม หอมกลมกล่อม ดื่มง่าย (กลม 300.- / ลิตร 400.-)",
    "price": 300,
    "imageUrl": "images/liquor_blend285.jpg",
    "options": "กลม (700ml) 300.-, ลิตร (1000ml) 400.-",
    "isAvailable": true
  },
  {
    "id": "m-lq-2",
    "categoryId": "cat-alcohol",
    "name": "หงส์ทอง (Hong Thong)",
    "description": "สุราปรุงพิเศษสีย้อมทอง หอมละมุน กลมกล่อม (แบน 200.- / กลม 380.-)",
    "price": 200,
    "imageUrl": "images/liquor_hongthong.jpg",
    "options": "แบน (350ml) 200.-, กลม (700ml) 380.-",
    "isAvailable": true
  },
  {
    "id": "m-lq-3",
    "categoryId": "cat-alcohol",
    "name": "แสงโสม (SangSom)",
    "description": "สุราพิเศษไทย หมักบ่มถังไม้โอ๊ก รสชาติเข้มข้น หอมกรุ่น (แบน 220.- / กลม 400.-)",
    "price": 220,
    "imageUrl": "images/liquor_sangsom.jpg",
    "options": "แบน (350ml) 220.-, กลม (700ml) 400.-",
    "isAvailable": true
  },
  {
    "id": "m-br-1",
    "categoryId": "cat-alcohol",
    "name": "เบียร์สิงห์ (Singha)",
    "description": "เบียร์สิงห์ขวดใหญ่ แช่เย็นเจี๊ยบ รสชาติเข้มข้น หอมกรุ่น (ขวดละ 90.-)",
    "price": 90,
    "imageUrl": "images/beer_singha.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-br-2",
    "categoryId": "cat-alcohol",
    "name": "เบียร์ลีโอ (Leo)",
    "description": "เบียร์ลีโอขวดใหญ่ แช่เย็น รสนุ่ม ดื่มง่าย ยอดนิยม (ขวดละ 80.-)",
    "price": 80,
    "imageUrl": "images/beer_leo.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-br-3",
    "categoryId": "cat-alcohol",
    "name": "เบียร์ช้าง (Chang)",
    "description": "เบียร์ช้างคลาสสิกขวดใหญ่ เย็นสดชื่น สะใจทุกแก้ว (ขวดละ 80.-)",
    "price": 80,
    "imageUrl": "images/beer_chang.jpg",
    "options": "",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ALCOHOL_MENUS;
}
if (typeof window !== 'undefined') {
  window.ALCOHOL_MENUS = ALCOHOL_MENUS;
}
