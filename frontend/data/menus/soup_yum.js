/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🍲 อาหารประเภทต้ม ยำ (6 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var SOUP_YUM_MENUS = [
  {
    "id": "m-ty-1",
    "categoryId": "cat-soup-yum",
    "name": "ต้มยำรวมมิตร",
    "description": "ต้มยำเครื่องแน่น หมู ไก่ กุ้ง หมึก เห็ดฟาง น้ำซุปต้มยำครบรส เปรี้ยว เค็ม เผ็ด หอมพริกเผา",
    "price": 120,
    "imageUrl": "images/tomyum_ruammit.jpg",
    "options": "น้ำข้น, น้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดจัดจ้าน",
    "isAvailable": true
  },
  {
    "id": "m-ty-2",
    "categoryId": "cat-soup-yum",
    "name": "ต้มยำทะเล ข้น/ใส",
    "description": "ต้มยำซีฟู้ด กุ้งแม่น้ำ ปลาหมึกสด หอยแมลงภู่ สมุนไพรไทย ข่า ตะไคร้ ใบมะกรูด มะนาวแท้",
    "price": 100,
    "imageUrl": "images/tomyum_talay.jpg",
    "options": "ต้มยำน้ำข้น, ต้มยำน้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก",
    "isAvailable": true
  },
  {
    "id": "m-ty-3",
    "categoryId": "cat-soup-yum",
    "name": "ยำวุ้นเส้น",
    "description": "วุ้นเส้นเหนียวนุ่ม ยำใส่หมูสับ กุ้งสด หมึกสด ถั่วลิสงคั่ว น้ำยำรสเปรี้ยวแซ่บจี๊ดจ๊าด",
    "price": 80,
    "imageUrl": "images/yum_woon_sen.jpg",
    "options": "ยำวุ้นเส้นรวมมิตร, ยำวุ้นเส้นหมูสับล้วน, เผ็ดน้อย, เผ็ดแซ่บ",
    "isAvailable": true
  },
  {
    "id": "m-ty-4",
    "categoryId": "cat-soup-yum",
    "name": "ยำทะเล",
    "description": "ยำซีฟู้ดรวม กุ้งเด้ง ปลาหมึกสดกรอบ หอยแมลงภู่ คลุกน้ำยำรสเด็ดจี๊ดจ๊าด ใส่ขึ้นฉ่ายหอมแดง",
    "price": 100,
    "imageUrl": "images/yum_talay.jpg",
    "options": "เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก",
    "isAvailable": true
  },
  {
    "id": "m-ty-5",
    "categoryId": "cat-soup-yum",
    "name": "กุ้งแช่น้ำปลา",
    "description": "กุ้งสดเนื้อหวานคัดพิเศษ แช่น้ำปลาดี เสิร์ฟพร้อมกระเทียมสด มะระสด และน้ำจิ้มซีฟู้ดมะนาวพริกขี้หนูสวน",
    "price": 100,
    "imageUrl": "images/goong_chae_nampla.jpg",
    "options": "น้ำจิ้มซีฟู้ดราดเลย, แยกน้ำจิ้ม, เพิ่มกระเทียมมะระ",
    "isAvailable": true
  },
  {
    "id": "m-ty-6",
    "categoryId": "cat-soup-yum",
    "name": "เฟรนช์ฟรายส์",
    "description": "มันฝรั่งแท่งทอดกรอบสีทอง กรอบนอกนุ่มใน ไม่อมน้ำมัน โรยเกลือเล็กน้อย เสิร์ฟพร้อมซอสมะเขือเทศและมายองเนส",
    "price": 50,
    "imageUrl": "images/french_fries.jpg",
    "options": "ซอสมะเขือเทศ, ซอสพริก, มายองเนส, รับทุกซอส",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SOUP_YUM_MENUS;
}
if (typeof window !== 'undefined') {
  window.SOUP_YUM_MENUS = SOUP_YUM_MENUS;
}
