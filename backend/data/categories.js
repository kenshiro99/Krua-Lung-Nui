/**
 * ครัวลุงหนุ่ย - ข้อมูลหมวดหมู่อาหาร (Categories)
 */
var DEFAULT_CATEGORIES = [
  {
    "id": "cat-all",
    "name": "ทั้งหมด"
  },
  {
    "id": "cat-recommend",
    "name": "🌟 รายการแนะนำ"
  },
  {
    "id": "cat-alacarte",
    "name": "🍳 อาหารตามสั่ง"
  },
  {
    "id": "cat-isan",
    "name": "🌶️ อาหารอีสาน ส้มตำ ลาบ ก้อย"
  },
  {
    "id": "cat-soup-yum",
    "name": "🍲 อาหารประเภทต้ม ยำ"
  },
  {
    "id": "cat-drink-promo",
    "name": "🔥 โปรต้อนรับร้านใหม่ (16.00-21.00)"
  },
  {
    "id": "cat-alcohol",
    "name": "🍾 เหล้า & เบียร์"
  },
  {
    "id": "cat-mixer",
    "name": "🧊 น้ำดื่ม & ของผสม"
  }
];

if (typeof window !== 'undefined') {
  window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEFAULT_CATEGORIES;
}
