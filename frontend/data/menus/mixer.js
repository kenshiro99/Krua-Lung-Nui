/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🧊 น้ำดื่ม & ของผสม (3 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var MIXER_MENUS = [
  {
    "id": "m-mx-1",
    "categoryId": "cat-mixer",
    "name": "โซดา (Soda)",
    "description": "โซดาสิงห์ขวดแก้ว ซ่าสดชื่นยาวนาน (ขวดละ 20 บาท)",
    "price": 20,
    "imageUrl": "images/mixer_soda.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-mx-2",
    "categoryId": "cat-mixer",
    "name": "น้ำเปล่า (Water)",
    "description": "น้ำดื่มสะอาดบริสุทธิ์ แช่เย็นสดชื่น (ขวดละ 10 บาท)",
    "price": 10,
    "imageUrl": "images/mixer_water.jpg",
    "options": "",
    "isAvailable": true
  },
  {
    "id": "m-mx-3",
    "categoryId": "cat-mixer",
    "name": "น้ำแข็ง (Ice Bucket)",
    "description": "น้ำแข็งถังแรกของทุกโต๊ะไม่คิดเงิน (ฟรี) • ถังต่อไปคิดถังละ 20 บาท",
    "price": 0,
    "imageUrl": "images/mixer_ice.jpg",
    "options": "ถังแรกประจำโต๊ะ (ฟรี), สั่งเพิ่มถังต่อไป 20.-",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MIXER_MENUS;
}
if (typeof window !== 'undefined') {
  window.MIXER_MENUS = MIXER_MENUS;
}
