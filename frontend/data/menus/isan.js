/**
 * ครัวลุงหนุ่ย - เมนูหมวดหมู่: 🌶️ อาหารอีสาน ส้มตำ ลาบ ก้อย (15 รายการ)
 * แก้ไข เพิ่มเติม หรือปรับราคาในหมวดนี้ได้โดยตรง โดยไม่กระทบเมนูหมวดหมู่อื่น
 */
var ISAN_MENUS = [
  {
    "id": "m-isa-1",
    "categoryId": "cat-isan",
    "name": "แกงอ่อมหมู",
    "description": "แกงอ่อมสไตล์อีสานแท้ ผักชีลาวหอมๆ มะเขือเปราะ ฟักทอง หมูนุ่ม ซดน้ำซุปหอมข้าวคั่ว",
    "price": 80,
    "imageUrl": "images/gaeng_om_moo.jpg",
    "options": "เผ็ดน้อย, เผ็ดปกติ, เผ็ดแซ่บ, เพิ่มผักชีลาว",
    "isAvailable": true
  },
  {
    "id": "m-isa-2",
    "categoryId": "cat-isan",
    "name": "ลาบเนื้อ ก้อยขม",
    "description": "เนื้อวัวสดคลุกเคล้าพริกป่นคั่วเอง ข้าวคั่วหอม ดีวัวรสขมกำลังดี หอมสะระแหน่และผักไผ่",
    "price": 90,
    "imageUrl": "images/larb_neua_koi_khom.jpg",
    "options": "ลาบสุก, ลาบดิบ, ก้อยขม (ใส่ดี), ไม่ขม",
    "isAvailable": true
  },
  {
    "id": "m-isa-3",
    "categoryId": "cat-isan",
    "name": "ต้มแซ่บ",
    "description": "ต้มแซ่บกระดูกหมูอ่อน/เนื้อเปื่อย น้ำซุปรสเปรี้ยวเผ็ดจี๊ดจ๊าด หอมสมุนไพรข่าตะไคร้ใบมะกรูด",
    "price": 80,
    "imageUrl": "images/tom_saap.jpg",
    "options": "หมูอ่อน, เนื้อเปื่อย, เผ็ดน้อย, เผ็ดจัดจ้าน",
    "isAvailable": true
  },
  {
    "id": "m-isa-4",
    "categoryId": "cat-isan",
    "name": "คอหมูย่าง",
    "description": "สันคอหมูหมักสูตรพิเศษย่างเตาถ่านหอมกรุ่น เนื้อนุ่มฉ่ำ เสิร์ฟพร้อมน้ำจิ้มแจ่วข้าวคั่วพริกป่น",
    "price": 80,
    "imageUrl": "images/kor_moo_yang.jpg",
    "options": "ติดมัน, มันน้อย, เพิ่มน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)",
    "isAvailable": true
  },
  {
    "id": "m-isa-5",
    "categoryId": "cat-isan",
    "name": "ไส้ตัวลวก",
    "description": "ไส้อ่อนหมูสดลวกสุกสะอาดนุ่มเด้ง ไม่เหนียว ไม่คาว โรยกระเทียมเจียว เสิร์ฟคู่น้ำจิ้มซีฟู้ดแจ่วแซ่บ",
    "price": 100,
    "imageUrl": "images/sai_tua_luak.jpg",
    "options": "น้ำจิ้มซีฟู้ด, น้ำจิ้มแจ่ว, รับทั้ง 2 น้ำจิ้ม",
    "isAvailable": true
  },
  {
    "id": "m-isa-6",
    "categoryId": "cat-isan",
    "name": "ลาบทะเล",
    "description": "กุ้งสดและปลาหมึกลวกสุกเด้ง คลุกเคล้าเครื่องลาบอีสาน ข้าวคั่ว มะนาวแท้ พริกป่นหอมจัดจ้าน",
    "price": 120,
    "imageUrl": "images/larb_talay.jpg",
    "options": "เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก",
    "isAvailable": true
  },
  {
    "id": "m-isa-7",
    "categoryId": "cat-isan",
    "name": "ตำปลาร้า",
    "description": "ส้มตำปลาร้าสูตรลุงหนุ่ย น้ำปลาร้าต้มสุกหอมนัว มะละกอกรอบ พริกแห้งพริกสดแซ่บสะใจ",
    "price": 50,
    "imageUrl": "images/somtum_plara.jpg",
    "options": "พริก 2 เม็ด (เผ็ดน้อย), พริก 5 เม็ด (เผ็ดปกติ), พริก 10 เม็ด (เผ็ดมาก), ไม่ใส่ชูรส",
    "isAvailable": true
  },
  {
    "id": "m-isa-8",
    "categoryId": "cat-isan",
    "name": "ตำทะเล",
    "description": "ตำส้มตำเครื่องซีฟู้ด กุ้งสด หมึกสด หอยแมลงภู่ คลุกเคล้าน้ำปลาร้า/ไทย รสเด็ดจัดจ้าน",
    "price": 100,
    "imageUrl": "images/somtum_talay.jpg",
    "options": "ตำปลาร้า, ตำไทย, เผ็ดน้อย, เผ็ดแซ่บจี๊ด",
    "isAvailable": true
  },
  {
    "id": "m-isa-9",
    "categoryId": "cat-isan",
    "name": "ตำกุ้งสด",
    "description": "ส้มตำรสเด็ดใส่กุ้งสดเนื้อหวานเด้ง ปลาร้านัวลึก พริกสด มะนาวแท้ แซ่บถึงเครื่อง",
    "price": 70,
    "imageUrl": "images/somtum_goong_sod.jpg",
    "options": "กุ้งสดดิบ, กุ้งลวกสุก, เผ็ดน้อย, เผ็ดปกติ, เผ็ดพ่นไฟ",
    "isAvailable": true
  },
  {
    "id": "m-isa-10",
    "categoryId": "cat-isan",
    "name": "ตำแตง ตำถั่ว",
    "description": "ตำแตงกวากรอบฉ่ำน้ำ หรือตำถั่วฝักยาวเคี้ยวกรุบกรอบ นัวน้ำปลาร้าสูตรเด็ดลุงหนุ่ย",
    "price": 60,
    "imageUrl": "images/somtum_taeng_thua.jpg",
    "options": "ตำแตง, ตำถั่วฝักยาว, ตำแตง+ถั่วรวม, เผ็ดปกติ, เผ็ดมาก",
    "isAvailable": true
  },
  {
    "id": "m-isa-11",
    "categoryId": "cat-isan",
    "name": "ลาบหมู",
    "description": "หมูสับล้วนปรุงรสลาบอีสานแท้ ข้าวคั่วคั่วใหม่ มะนาวสด หอมแดง สะระแหน่ ต้นหอมผักชี",
    "price": 80,
    "imageUrl": "images/larb_moo.jpg",
    "options": "ใส่ตับหมู, ไม่ใส่ตับ, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก",
    "isAvailable": true
  },
  {
    "id": "m-isa-12",
    "categoryId": "cat-isan",
    "name": "ตับหวาน",
    "description": "ตับหมูสดลวกสุกกำลังนุ่มฉ่ำ ไม่แข็ง คลุกเครื่องลาบรสเปรี้ยวเค็มเผ็ดหอมข้าวคั่ว",
    "price": 80,
    "imageUrl": "images/tub_whan.jpg",
    "options": "ตับสุกนุ่ม, ตับสุกพอดี, เผ็ดน้อย, เผ็ดปกติ",
    "isAvailable": true
  },
  {
    "id": "m-isa-13",
    "categoryId": "cat-isan",
    "name": "น้ำตกหมู",
    "description": "เนื้อหมูย่างเตาถ่านหั่นชิ้นพอดีคำ คลุกเคล้าน้ำตกสมุนไพร ข้าวคั่วหอม พริกป่น น้ำปลา มะนาวสด",
    "price": 80,
    "imageUrl": "images/nam_tok_moo.jpg",
    "options": "หมูติดมัน, เนื้อล้วน, เผ็ดปกติ, เผ็ดมาก",
    "isAvailable": true
  },
  {
    "id": "m-isa-14",
    "categoryId": "cat-isan",
    "name": "เสือร้องไห้",
    "description": "เนื้อวัวส่วนอกติดมันหมักซอสย่างเตาถ่านหอมกรุ่น นุ่มหนึบเคี้ยวเพลิน เสิร์ฟคู่น้ำจิ้มแจ่วรสเด็ด",
    "price": 80,
    "imageUrl": "images/suea_rong_hai.jpg",
    "options": "ติดมัน, มันน้อย, สุกปานกลาง (Medium), สุกทั่ว (Well done)",
    "isAvailable": true
  },
  {
    "id": "m-isa-15",
    "categoryId": "cat-isan",
    "name": "หมูแดดเดียวทอด",
    "description": "เนื้อหมูหมักเครื่องเทศตากแดดจนได้ที่ ทอดร้อนๆ เนื้อนุ่มฉ่ำ รสกลมกล่อม ทานคู่ข้าวเหนียวเด็ดมาก",
    "price": 80,
    "imageUrl": "images/moo_daed_deaw.jpg",
    "options": "พร้อมซอสพริก, พร้อมน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)",
    "isAvailable": true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ISAN_MENUS;
}
if (typeof window !== 'undefined') {
  window.ISAN_MENUS = ISAN_MENUS;
}
