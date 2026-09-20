/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🍳 อาหารตามสั่ง (4 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var ALACARTE_MENUS = [
  {
    "id": "m-ala-1",
    "categoryId": "cat-alacarte",
    "name": "กระเพราหมู",
    "description": "หมูสับ/หมูชิ้นผัดกะเพรารสเด็ดคั่วแห้งพริกกระเทียม ใบกะเพราหอมกรุ่น ราดข้าวสวยร้อนๆ",
    "price": 50,
    "imageUrl": "images/krapow_moo.jpg",
    "options": "หมูสับ, หมูชิ้น, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10)",
    "isAvailable": true
  },
  {
    "id": "m-ala-2",
    "categoryId": "cat-alacarte",
    "name": "กระเพราไก่",
    "description": "เนื้อไก่นุ่มผัดพริกกระเทียมใบกะเพราป่ารสชาติเข้มข้นจัดจ้าน อร่อยเด็ดถึงใจ",
    "price": 50,
    "imageUrl": "images/krapow_gai.jpg",
    "options": "เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+10)",
    "isAvailable": true
  },
  {
    "id": "m-ala-3",
    "categoryId": "cat-alacarte",
    "name": "กระเพราทะเล",
    "description": "กุ้งสดตัวโต ปลาหมึกกรอบเนื้อเด้ง ผัดกะเพราพริกสดรสจัดจ้าน จัดเต็มซีฟู้ดสดใหม่",
    "price": 60,
    "imageUrl": "images/krapow_talay.jpg",
    "options": "เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)",
    "isAvailable": true
  },
  {
    "id": "m-ala-4",
    "categoryId": "cat-alacarte",
    "name": "กระเพรารวม",
    "description": "กะเพราเครื่องแน่นรวมมิตร หมู ไก่ กุ้ง หมึก ผัดคลุกเคล้าพริกแห้งและใบกะเพราหอมฟุ้ง",
    "price": 60,
    "imageUrl": "images/krapow_ruam.jpg",
    "options": "เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ALACARTE_MENUS;
}
if (typeof window !== 'undefined') {
  window.ALACARTE_MENUS = ALACARTE_MENUS;
}
