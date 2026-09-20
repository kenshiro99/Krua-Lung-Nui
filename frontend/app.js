
// Supabase Storage Bucket Helper
const SUPABASE_BUCKET_BASE = 'https://myajcbynabcwfmlvqpwv.supabase.co/storage/v1/object/public/krua-lung-nui-assets/';

function resolveImageUrl(img) {
  if (!img) return 'logo/logo.png';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const clean = img.replace(/^images\//, '').replace(/^image\//, '');
  return SUPABASE_BUCKET_BASE + clean;
}
/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Customer Mobile Web App Logic
 * Dual-Mode Edition: ทานที่ร้าน (Dine-in) & สั่งกลับบ้าน (Takeaway)
 */

// ============================================================================
// 1. Initial State & Defaults
// ============================================================================
const DEFAULT_SHOP_SETTINGS = {
  shopName: "ครัวลุงหนุ่ย (Krua Lung Nui)",
  phone: "089-123-4567",
  address: "ร้านครัวลุงหนุ่ย อร่อยเหมือนกินที่บ้าน",
  receiptFooter: "อร่อยเหมือนกินที่บ้าน • ขอบคุณที่อุดหนุนครัวลุงหนุ่ยครับ 🙏",
  promptpayType: "mobile",
  promptpayId: "0891234567",
  promptpayName: "ครัวลุงหนุ่ย (Krua Lung Nui)",
  serviceCharge: 0,
  vat: 0
};

var DEFAULT_CATEGORIES = (typeof window !== 'undefined' && window.DEFAULT_CATEGORIES && window.DEFAULT_CATEGORIES.length > 0)
  ? window.DEFAULT_CATEGORIES
  : [
      { id: "cat-all", name: "ทั้งหมด" },
      { id: "cat-recommend", name: "🌟 รายการแนะนำ" },
      { id: "cat-alacarte", name: "🍳 อาหารตามสั่ง" },
      { id: "cat-isan", name: "🌶️ อาหารอีสาน ส้มตำ ลาบ ก้อย" },
      { id: "cat-soup-yum", name: "🍲 อาหารประเภทต้ม ยำ" },
      { id: "cat-drink-promo", name: "🔥 โปรต้อนรับร้านใหม่ (16.00-21.00)" },
      { id: "cat-alcohol", name: "🍾 เหล้า & เบียร์" },
      { id: "cat-mixer", name: "🧊 น้ำดื่ม & ของผสม" }
    ];

const FRONTEND_FALLBACK_MENUS = [{"id":"m-rec-1","categoryId":"cat-recommend","name":"ต้มเลือดหมู","description":"น้ำซุปหอมหวานกระดูกหมู เลือดหมูนุ่ม หมูสับก้อน หมูชิ้น ตำลึงสด โรยกระเทียมเจียวหอมกรุ่น","price":50,"imageUrl":"images/tom_luead_moo.jpg","options":"ใส่ทุกอย่าง, ไม่ใส่เครื่องใน, เพิ่มข้าวสวย (+10), พิเศษ (+10)","isAvailable":true},{"id":"m-rec-2","categoryId":"cat-recommend","name":"ข้าวมันไก่","description":"ข้าวมันหอมนุ่มเม็ดสวย ไก่ตอนเนื้อฉ่ำนุ่ม น้ำจิ้มเต้าเจี้ยวขิงสูตรเด็ด เสิร์ฟคู่น้ำซุปร้อนๆ","price":50,"imageUrl":"images/khao_man_gai.jpg","options":"เนื้ออก, เนื้อสะโพก, เนื้อน่อง, พิเศษ (+10)","isAvailable":true},{"id":"m-rec-3","categoryId":"cat-recommend","name":"ก๋วยเตี๋ยวหมู","description":"ก๋วยเตี๋ยวหมูน้ำใสกลมกล่อม หมูแดง หมูสับ ลูกชิ้นหมู เกี๊ยวกรอบ โรยถั่วลิสงคั่วหอม","price":50,"imageUrl":"images/kuay_tiew_moo.jpg","options":"เส้นเล็ก, เส้นใหญ่, เส้นหมี่ขาว, บะหมี่เหลือง, พิเศษ (+10)","isAvailable":true},{"id":"m-ala-1","categoryId":"cat-alacarte","name":"กระเพราหมู","description":"หมูสับ/หมูชิ้นผัดกะเพรารสเด็ดคั่วแห้งพริกกระเทียม ใบกะเพราหอมกรุ่น ราดข้าวสวยร้อนๆ","price":50,"imageUrl":"images/krapow_moo.jpg","options":"หมูสับ, หมูชิ้น, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10)","isAvailable":true},{"id":"m-ala-2","categoryId":"cat-alacarte","name":"กระเพราไก่","description":"เนื้อไก่นุ่มผัดพริกกระเทียมใบกะเพราป่ารสชาติเข้มข้นจัดจ้าน อร่อยเด็ดถึงใจ","price":50,"imageUrl":"images/krapow_gai.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+10)","isAvailable":true},{"id":"m-ala-3","categoryId":"cat-alacarte","name":"กระเพราทะเล","description":"กุ้งสดตัวโต ปลาหมึกกรอบเนื้อเด้ง ผัดกะเพราพริกสดรสจัดจ้าน จัดเต็มซีฟู้ดสดใหม่","price":60,"imageUrl":"images/krapow_talay.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)","isAvailable":true},{"id":"m-ala-4","categoryId":"cat-alacarte","name":"กระเพรารวม","description":"กะเพราเครื่องแน่นรวมมิตร หมู ไก่ กุ้ง หมึก ผัดคลุกเคล้าพริกแห้งและใบกะเพราหอมฟุ้ง","price":60,"imageUrl":"images/krapow_ruam.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)","isAvailable":true},{"id":"m-isa-1","categoryId":"cat-isan","name":"แกงอ่อมหมู","description":"แกงอ่อมสไตล์อีสานแท้ ผักชีลาวหอมๆ มะเขือเปราะ ฟักทอง หมูนุ่ม ซดน้ำซุปหอมข้าวคั่ว","price":80,"imageUrl":"images/gaeng_om_moo.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดแซ่บ, เพิ่มผักชีลาว","isAvailable":true},{"id":"m-isa-2","categoryId":"cat-isan","name":"ลาบเนื้อ ก้อยขม","description":"เนื้อวัวสดคลุกเคล้าพริกป่นคั่วเอง ข้าวคั่วหอม ดีวัวรสขมกำลังดี หอมสะระแหน่และผักไผ่","price":90,"imageUrl":"images/larb_neua_koi_khom.jpg","options":"ลาบสุก, ลาบดิบ, ก้อยขม (ใส่ดี), ไม่ขม","isAvailable":true},{"id":"m-isa-3","categoryId":"cat-isan","name":"ต้มแซ่บ","description":"ต้มแซ่บกระดูกหมูอ่อน/เนื้อเปื่อย น้ำซุปรสเปรี้ยวเผ็ดจี๊ดจ๊าด หอมสมุนไพรข่าตะไคร้ใบมะกรูด","price":80,"imageUrl":"images/tom_saap.jpg","options":"หมูอ่อน, เนื้อเปื่อย, เผ็ดน้อย, เผ็ดจัดจ้าน","isAvailable":true},{"id":"m-isa-4","categoryId":"cat-isan","name":"คอหมูย่าง","description":"สันคอหมูหมักสูตรพิเศษย่างเตาถ่านหอมกรุ่น เนื้อนุ่มฉ่ำ เสิร์ฟพร้อมน้ำจิ้มแจ่วข้าวคั่วพริกป่น","price":80,"imageUrl":"images/kor_moo_yang.jpg","options":"ติดมัน, มันน้อย, เพิ่มน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)","isAvailable":true},{"id":"m-isa-5","categoryId":"cat-isan","name":"ไส้ตัวลวก","description":"ไส้อ่อนหมูสดลวกสุกสะอาดนุ่มเด้ง ไม่เหนียว ไม่คาว โรยกระเทียมเจียว เสิร์ฟคู่น้ำจิ้มซีฟู้ดแจ่วแซ่บ","price":100,"imageUrl":"images/sai_tua_luak.jpg","options":"น้ำจิ้มซีฟู้ด, น้ำจิ้มแจ่ว, รับทั้ง 2 น้ำจิ้ม","isAvailable":true},{"id":"m-isa-6","categoryId":"cat-isan","name":"ลาบทะเล","description":"กุ้งสดและปลาหมึกลวกสุกเด้ง คลุกเคล้าเครื่องลาบอีสาน ข้าวคั่ว มะนาวแท้ พริกป่นหอมจัดจ้าน","price":120,"imageUrl":"images/larb_talay.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-7","categoryId":"cat-isan","name":"ตำปลาร้า","description":"ส้มตำปลาร้าสูตรลุงหนุ่ย น้ำปลาร้าต้มสุกหอมนัว มะละกอกรอบ พริกแห้งพริกสดแซ่บสะใจ","price":50,"imageUrl":"images/somtum_plara.jpg","options":"พริก 2 เม็ด (เผ็ดน้อย), พริก 5 เม็ด (เผ็ดปกติ), พริก 10 เม็ด (เผ็ดมาก), ไม่ใส่ชูรส","isAvailable":true},{"id":"m-isa-8","categoryId":"cat-isan","name":"ตำทะเล","description":"ตำส้มตำเครื่องซีฟู้ด กุ้งสด หมึกสด หอยแมลงภู่ คลุกเคล้าน้ำปลาร้า/ไทย รสเด็ดจัดจ้าน","price":100,"imageUrl":"images/somtum_talay.jpg","options":"ตำปลาร้า, ตำไทย, เผ็ดน้อย, เผ็ดแซ่บจี๊ด","isAvailable":true},{"id":"m-isa-9","categoryId":"cat-isan","name":"ตำกุ้งสด","description":"ส้มตำรสเด็ดใส่กุ้งสดเนื้อหวานเด้ง ปลาร้านัวลึก พริกสด มะนาวแท้ แซ่บถึงเครื่อง","price":70,"imageUrl":"images/somtum_goong_sod.jpg","options":"กุ้งสดดิบ, กุ้งลวกสุก, เผ็ดน้อย, เผ็ดปกติ, เผ็ดพ่นไฟ","isAvailable":true},{"id":"m-isa-10","categoryId":"cat-isan","name":"ตำแตง ตำถั่ว","description":"ตำแตงกวากรอบฉ่ำน้ำ หรือตำถั่วฝักยาวเคี้ยวกรุบกรอบ นัวน้ำปลาร้าสูตรเด็ดลุงหนุ่ย","price":60,"imageUrl":"images/somtum_taeng_thua.jpg","options":"ตำแตง, ตำถั่วฝักยาว, ตำแตง+ถั่วรวม, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-11","categoryId":"cat-isan","name":"ลาบหมู","description":"หมูสับล้วนปรุงรสลาบอีสานแท้ ข้าวคั่วคั่วใหม่ มะนาวสด หอมแดง สะระแหน่ ต้นหอมผักชี","price":80,"imageUrl":"images/larb_moo.jpg","options":"ใส่ตับหมู, ไม่ใส่ตับ, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-12","categoryId":"cat-isan","name":"ตับหวาน","description":"ตับหมูสดลวกสุกกำลังนุ่มฉ่ำ ไม่แข็ง คลุกเครื่องลาบรสเปรี้ยวเค็มเผ็ดหอมข้าวคั่ว","price":80,"imageUrl":"images/tub_whan.jpg","options":"ตับสุกนุ่ม, ตับสุกพอดี, เผ็ดน้อย, เผ็ดปกติ","isAvailable":true},{"id":"m-isa-13","categoryId":"cat-isan","name":"น้ำตกหมู","description":"เนื้อหมูย่างเตาถ่านหั่นชิ้นพอดีคำ คลุกเคล้าน้ำตกสมุนไพร ข้าวคั่วหอม พริกป่น น้ำปลา มะนาวสด","price":80,"imageUrl":"images/nam_tok_moo.jpg","options":"หมูติดมัน, เนื้อล้วน, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-14","categoryId":"cat-isan","name":"เสือร้องไห้","description":"เนื้อวัวส่วนอกติดมันหมักซอสย่างเตาถ่านหอมกรุ่น นุ่มหนึบเคี้ยวเพลิน เสิร์ฟคู่น้ำจิ้มแจ่วรสเด็ด","price":80,"imageUrl":"images/suea_rong_hai.jpg","options":"ติดมัน, มันน้อย, สุกปานกลาง (Medium), สุกทั่ว (Well done)","isAvailable":true},{"id":"m-isa-15","categoryId":"cat-isan","name":"หมูแดดเดียวทอด","description":"เนื้อหมูหมักเครื่องเทศตากแดดจนได้ที่ ทอดร้อนๆ เนื้อนุ่มฉ่ำ รสกลมกล่อม ทานคู่ข้าวเหนียวเด็ดมาก","price":80,"imageUrl":"images/moo_daed_deaw.jpg","options":"พร้อมซอสพริก, พร้อมน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)","isAvailable":true},{"id":"m-ty-1","categoryId":"cat-soup-yum","name":"ต้มยำรวมมิตร","description":"ต้มยำเครื่องแน่น หมู ไก่ กุ้ง หมึก เห็ดฟาง น้ำซุปต้มยำครบรส เปรี้ยว เค็ม เผ็ด หอมพริกเผา","price":120,"imageUrl":"images/tomyum_ruammit.jpg","options":"น้ำข้น, น้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดจัดจ้าน","isAvailable":true},{"id":"m-ty-2","categoryId":"cat-soup-yum","name":"ต้มยำทะเล ข้น/ใส","description":"ต้มยำซีฟู้ด กุ้งแม่น้ำ ปลาหมึกสด หอยแมลงภู่ สมุนไพรไทย ข่า ตะไคร้ ใบมะกรูด มะนาวแท้","price":100,"imageUrl":"images/tomyum_talay.jpg","options":"ต้มยำน้ำข้น, ต้มยำน้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-ty-3","categoryId":"cat-soup-yum","name":"ยำวุ้นเส้น","description":"วุ้นเส้นเหนียวนุ่ม ยำใส่หมูสับ กุ้งสด หมึกสด ถั่วลิสงคั่ว น้ำยำรสเปรี้ยวแซ่บจี๊ดจ๊าด","price":80,"imageUrl":"images/yum_woon_sen.jpg","options":"ยำวุ้นเส้นรวมมิตร, ยำวุ้นเส้นหมูสับล้วน, เผ็ดน้อย, เผ็ดแซ่บ","isAvailable":true},{"id":"m-ty-4","categoryId":"cat-soup-yum","name":"ยำทะเล","description":"ยำซีฟู้ดรวม กุ้งเด้ง ปลาหมึกสดกรอบ หอยแมลงภู่ คลุกน้ำยำรสเด็ดจี๊ดจ๊าด ใส่ขึ้นฉ่ายหอมแดง","price":100,"imageUrl":"images/yum_talay.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-ty-5","categoryId":"cat-soup-yum","name":"กุ้งแช่น้ำปลา","description":"กุ้งสดเนื้อหวานคัดพิเศษ แช่น้ำปลาดี เสิร์ฟพร้อมกระเทียมสด มะระสด และน้ำจิ้มซีฟู้ดมะนาวพริกขี้หนูสวน","price":100,"imageUrl":"images/goong_chae_nampla.jpg","options":"น้ำจิ้มซีฟู้ดราดเลย, แยกน้ำจิ้ม, เพิ่มกระเทียมมะระ","isAvailable":true},{"id":"m-ty-6","categoryId":"cat-soup-yum","name":"เฟรนช์ฟรายส์","description":"มันฝรั่งแท่งทอดกรอบสีทอง กรอบนอกนุ่มใน ไม่อมน้ำมัน โรยเกลือเล็กน้อย เสิร์ฟพร้อมซอสมะเขือเทศและมายองเนส","price":50,"imageUrl":"images/french_fries.jpg","options":"ซอสมะเขือเทศ, ซอสพริก, มายองเนส, รับทุกซอส","isAvailable":true},{"id":"m-pr-1","categoryId":"cat-drink-promo","name":"โปรเบียร์ลีโอ 3 ขวด 230.- (ปกติ 240.-)","description":"สุดคุ้มชุดประหยัด เบียร์ลีโอ 3 ขวดใหญ่ แช่เย็นพร้อมเสิร์ฟ","price":230,"imageUrl":"images/promo_beer_leo_3.jpg","options":"","isAvailable":true},{"id":"m-pr-2","categoryId":"cat-drink-promo","name":"โปรเบียร์ช้าง 3 ขวด 230.- (ปกติ 240.-)","description":"โปรโมชั่นสุดคุ้ม เบียร์ช้างคลาสสิก 3 ขวดใหญ่ เย็นสะใจ","price":230,"imageUrl":"images/promo_beer_chang_3.jpg","options":"","isAvailable":true},{"id":"m-pr-3","categoryId":"cat-drink-promo","name":"โปรเบียร์สิงห์ 3 ขวด 260.- (ปกติ 270.-)","description":"โปรโมชั่นสิงห์ 3 ขวดใหญ่ รสชาติเข้มข้น ดื่มด่ำทุกช่วงเวลา","price":260,"imageUrl":"images/promo_beer_singha_3.jpg","options":"","isAvailable":true},{"id":"m-dp-1","categoryId":"cat-drink-promo","name":"โปรเบียร์สิงห์ 2 ขวด (โปรต้อนรับร้านใหม่)","description":"เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)","price":99,"imageUrl":"images/promo_beer_singha.jpg","options":"","isAvailable":true},{"id":"m-dp-2","categoryId":"cat-drink-promo","name":"เบียร์ช้าง หรือ ลีโอ 2 ขวด (โปรต้อนรับร้านใหม่)","description":"เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)","price":89,"imageUrl":"images/promo_beer_chang_leo.jpg","options":"","isAvailable":true},{"id":"m-dp-3","categoryId":"cat-drink-promo","name":"เบลนด์ 285 ขวดลิตร (โปรต้อนรับร้านใหม่)","description":"แถมฟรีโซดา 4 ขวด และน้ำแข็ง 1 ถัง + แถมฟรีเฟรนช์ฟรายส์ 1 จาน (เสิร์ฟช่วง 16.00–21.00 น. จำกัดโต๊ะละ 1 ชุด)","price":350,"imageUrl":"images/promo_blend285.jpg","options":"","isAvailable":true},{"id":"m-lq-1","categoryId":"cat-alcohol","name":"เบลนด์ 285 (Blend 285)","description":"สุราผสมกลิ่นวิสกี้ รสนุ่ม หอมกลมกล่อม ดื่มง่าย (กลม 300.- / ลิตร 400.-)","price":300,"imageUrl":"images/liquor_blend285.jpg","options":"กลม (700ml) 300.-, ลิตร (1000ml) 400.-","isAvailable":true},{"id":"m-lq-2","categoryId":"cat-alcohol","name":"หงส์ทอง (Hong Thong)","description":"สุราปรุงพิเศษสีย้อมทอง หอมละมุน กลมกล่อม (แบน 200.- / กลม 380.-)","price":200,"imageUrl":"images/liquor_hongthong.jpg","options":"แบน (350ml) 200.-, กลม (700ml) 380.-","isAvailable":true},{"id":"m-lq-3","categoryId":"cat-alcohol","name":"แสงโสม (SangSom)","description":"สุราพิเศษไทย หมักบ่มถังไม้โอ๊ก รสชาติเข้มข้น หอมกรุ่น (แบน 220.- / กลม 400.-)","price":220,"imageUrl":"images/liquor_sangsom.jpg","options":"แบน (350ml) 220.-, กลม (700ml) 400.-","isAvailable":true},{"id":"m-br-1","categoryId":"cat-alcohol","name":"เบียร์สิงห์ (Singha)","description":"เบียร์สิงห์ขวดใหญ่ แช่เย็นเจี๊ยบ รสชาติเข้มข้น หอมกรุ่น (ขวดละ 90.-)","price":90,"imageUrl":"images/beer_singha.jpg","options":"","isAvailable":true},{"id":"m-br-2","categoryId":"cat-alcohol","name":"เบียร์ลีโอ (Leo)","description":"เบียร์ลีโอขวดใหญ่ แช่เย็น รสนุ่ม ดื่มง่าย ยอดนิยม (ขวดละ 80.-)","price":80,"imageUrl":"images/beer_leo.jpg","options":"","isAvailable":true},{"id":"m-br-3","categoryId":"cat-alcohol","name":"เบียร์ช้าง (Chang)","description":"เบียร์ช้างคลาสสิกขวดใหญ่ เย็นสดชื่น สะใจทุกแก้ว (ขวดละ 80.-)","price":80,"imageUrl":"images/beer_chang.jpg","options":"","isAvailable":true},{"id":"m-mx-1","categoryId":"cat-mixer","name":"โซดา (Soda)","description":"โซดาสิงห์ขวดแก้ว ซ่าสดชื่นยาวนาน (ขวดละ 20 บาท)","price":20,"imageUrl":"images/mixer_soda.jpg","options":"","isAvailable":true},{"id":"m-mx-2","categoryId":"cat-mixer","name":"น้ำเปล่า (Water)","description":"น้ำดื่มสะอาดบริสุทธิ์ แช่เย็นสดชื่น (ขวดละ 10 บาท)","price":10,"imageUrl":"images/mixer_water.jpg","options":"","isAvailable":true},{"id":"m-mx-3","categoryId":"cat-mixer","name":"น้ำแข็ง (Ice Bucket)","description":"น้ำแข็งถังแรกของทุกโต๊ะไม่คิดเงิน (ฟรี) • ถังต่อไปคิดถังละ 20 บาท","price":0,"imageUrl":"images/mixer_ice.jpg","options":"ถังแรกประจำโต๊ะ (ฟรี), สั่งเพิ่มถังต่อไป 20.-","isAvailable":true}];
var DEFAULT_MENUS = (typeof window !== 'undefined' && window.DEFAULT_MENUS && window.DEFAULT_MENUS.length > 0)
  ? window.DEFAULT_MENUS
  : FRONTEND_FALLBACK_MENUS;

var DEFAULT_TABLES = [
  { id: "t-1", name: "1" },
  { id: "t-2", name: "2" },
  { id: "t-3", name: "3" },
  { id: "t-4", name: "4" },
  { id: "t-5", name: "5" },
  { id: "t-6", name: "6" },
  { id: "t-7", name: "7" },
  { id: "t-8", name: "8" },
  { id: "t-9", name: "9" },
  { id: "t-10", name: "10" }
];

// Menu Version Identifier to auto-sync fresh menus without clearing browser cache manually
const MENU_SCHEMA_VERSION = "krua_lung_nui_v7_auto_reset";

if (localStorage.getItem("pos_menu_version") !== MENU_SCHEMA_VERSION) {
  localStorage.setItem("pos_menus", JSON.stringify(DEFAULT_MENUS));
  localStorage.setItem("pos_categories", JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem("pos_menu_version", MENU_SCHEMA_VERSION);
}

// App State
const storedMenus = JSON.parse(localStorage.getItem("pos_menus"));
const storedCategories = JSON.parse(localStorage.getItem("pos_categories"));
const storedSettings = JSON.parse(localStorage.getItem("pos_settings"));
const storedTables = JSON.parse(localStorage.getItem("pos_tables"));

let state = {
  settings: (storedSettings && storedSettings.shopName) ? storedSettings : DEFAULT_SHOP_SETTINGS,
  categories: (storedCategories && storedCategories.length > 0) ? storedCategories : DEFAULT_CATEGORIES,
  menus: (storedMenus && storedMenus.length > 0) ? storedMenus : DEFAULT_MENUS,
  tables: (storedTables && storedTables.length > 0) ? storedTables : DEFAULT_TABLES,
  orderMode: "dinein", // "dinein" | "takeaway"
  currentTable: null,
  isTableScanned: false,
  pendingCustomItemId: null,
  currentQueue: "Q-" + Math.floor(10 + Math.random() * 89),
  selectedCategory: "cat-all",
  cart: [],
  activeCustomItem: null,
  customQty: 1
};

// ============================================================================
// 2. Initialization & LIFF URL Parameter Parsing
// ============================================================================
let currentLiffPage = "menu"; // "menu" | "order" | "promotion" | "contact" | "reservation"
let lineUserProfile = null;

document.addEventListener("DOMContentLoaded", () => {

  // ⚡ Auto-Reset: Auto-repair customer frontend menus
  if (!state.menus || state.menus.length < 30) {
    console.log("⚡ Auto-Reset: Restoring frontend menus...");
    state.menus = (typeof window.DEFAULT_MENUS !== 'undefined' && window.DEFAULT_MENUS.length > 0) ? window.DEFAULT_MENUS : FRONTEND_FALLBACK_MENUS;
    state.categories = (typeof window.DEFAULT_CATEGORIES !== 'undefined' && window.DEFAULT_CATEGORIES.length > 0) ? window.DEFAULT_CATEGORIES : DEFAULT_CATEGORIES;
    localStorage.setItem("pos_menus", JSON.stringify(state.menus));
    localStorage.setItem("pos_categories", JSON.stringify(state.categories));
  }

  // Enforce latest drinks if still pointing to old 24 items
  if (state.menus.length < 30 || !state.menus.some(m => m.name.includes("เบียร์สิงห์"))) {
    state.menus = DEFAULT_MENUS;
    state.categories = DEFAULT_CATEGORIES;
    localStorage.setItem("pos_menus", JSON.stringify(DEFAULT_MENUS));
    localStorage.setItem("pos_categories", JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem("pos_menu_version", MENU_SCHEMA_VERSION);
  }

  // Parse URL Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get("page");
  const typeParam = urlParams.get("type");
  const tableParam = urlParams.get("table");

  if (typeParam === "takeaway") {
    setOrderMode("takeaway");
  } else if (tableParam) {
    const cleanTable = String(tableParam).trim().replace(/^โต๊ะ\s*/, '').replace(/^t-/, '');
    state.currentTable = cleanTable;
    state.isTableScanned = true;
    sessionStorage.setItem("pos_scanned_table", cleanTable);
    localStorage.setItem("pos_scanned_table", cleanTable);
    setOrderMode("dinein");
  } else {
    // Check if table was scanned earlier in this session or stored locally
    const savedTable = sessionStorage.getItem("pos_scanned_table") || localStorage.getItem("pos_scanned_table");
    if (savedTable) {
      state.currentTable = savedTable;
      state.isTableScanned = true;
    } else {
      state.currentTable = null;
      state.isTableScanned = false;
    }
    setOrderMode("dinein");
  }

  // Ensure state menus are always available
  if (!state.menus || state.menus.length === 0) {
    state.menus = DEFAULT_MENUS;
  }
  if (!state.categories || state.categories.length === 0) {
    state.categories = DEFAULT_CATEGORIES;
  }

  // Render initial components
  renderCategoryTabs();
  renderMenuFeed();
  updateCartUI();
  checkActiveOrders();
  refreshIcons();

  // Mascot Initial Greeting
  if (state.isTableScanned && state.currentTable) {
    updateMascotGreeting("table_confirmed");
  } else if (state.orderMode === "takeaway") {
    updateMascotGreeting("takeaway");
  } else {
    updateMascotGreeting("default");
  }

  // Set initial page from ?page=...
  if (pageParam && ["menu", "order", "map", "promotion", "contact", "reservation"].includes(pageParam)) {
    switchLiffPage(pageParam);
  } else if (typeParam === "takeaway" || tableParam) {
    switchLiffPage("order");
  } else {
    switchLiffPage("menu");
  }

  // Init LINE LIFF if available
  initLineLiff();
});

// LINE LIFF SDK Initialization
function initLineLiff() {
  if (window.liff) {
    // You can replace with your real LIFF ID if registered in LINE Developers Console
    liff.init({ liffId: window.LIFF_ID || "2011360237-nVKENOs7" }).then(() => {
      if (liff.isLoggedIn()) {
        liff.getProfile().then(profile => {
          lineUserProfile = profile;
          const nameInput = document.getElementById("custNameInput");
          if (nameInput) nameInput.value = profile.displayName || "";
          const resNameInput = document.getElementById("resCustName");
          if (resNameInput) resNameInput.value = profile.displayName || "";
        }).catch(err => console.log("LIFF getProfile Error:", err));
      }
    }).catch(err => {
      // In standalone browser without LIFF, gracefully continue
      console.log("LIFF standalone mode:", err);
    });
  }
}

// LIFF Page Switcher (Matching 6 LINE Rich Menu buttons)
function switchLiffPage(page) {
  currentLiffPage = page;
  
  // Hide all page views
  document.querySelectorAll(".liff-page-view").forEach(el => el.classList.remove("active"));
  
  // Remove active from all nav buttons
  document.querySelectorAll(".liff-nav-item").forEach(el => el.classList.remove("active"));

  // Header Context Banner display logic
  const contextBanner = document.getElementById("orderContextBanner");
  const searchCatArea = document.getElementById("headerSearchCategoryArea");
  const floatCartBar = document.getElementById("floatingCartBar");

  if (page === "menu" || page === "order") {
    document.getElementById("pageViewMenu")?.classList.add("active");
    if (page === "menu") document.getElementById("navBtnMenu")?.classList.add("active");
    if (page === "order") document.getElementById("navBtnOrder")?.classList.add("active");
    if (contextBanner) contextBanner.style.display = "flex";

    // Strictly enforce table scan: If dine-in and not yet scanned, hide search/categories and show gate
    if (state.orderMode === "dinein" && !state.isTableScanned) {
      if (searchCatArea) searchCatArea.style.display = "none";
      if (floatCartBar) floatCartBar.style.display = "none";
      renderMenuFeed();
    } else {
      if (searchCatArea) searchCatArea.style.display = "block";
      if (floatCartBar) floatCartBar.style.display = (page === "order" || state.cart.length > 0) ? "flex" : "none";
      renderMenuFeed();
    }
  } else if (page === "map") {
    document.getElementById("pageViewMap")?.classList.add("active");
    document.getElementById("navBtnMap")?.classList.add("active");
    if (contextBanner) contextBanner.style.display = "none";
    if (searchCatArea) searchCatArea.style.display = "none";
    if (floatCartBar) floatCartBar.style.display = "none";
  } else if (page === "promotion") {
    document.getElementById("pageViewPromotion")?.classList.add("active");
    document.getElementById("navBtnPromotion")?.classList.add("active");
    if (contextBanner) contextBanner.style.display = "none";
    if (searchCatArea) searchCatArea.style.display = "none";
    if (floatCartBar) floatCartBar.style.display = "none";
  } else if (page === "contact") {
    document.getElementById("pageViewContact")?.classList.add("active");
    document.getElementById("navBtnContact")?.classList.add("active");
    if (contextBanner) contextBanner.style.display = "none";
    if (searchCatArea) searchCatArea.style.display = "none";
    if (floatCartBar) floatCartBar.style.display = "none";
  } else if (page === "reservation") {
    document.getElementById("pageViewReservation")?.classList.add("active");
    document.getElementById("navBtnReservation")?.classList.add("active");
    if (contextBanner) contextBanner.style.display = "none";
    if (searchCatArea) searchCatArea.style.display = "none";
    if (floatCartBar) floatCartBar.style.display = "none";
    
    // Set default reservation date to today
    const resDate = document.getElementById("resDate");
    if (resDate && !resDate.value) {
      const today = new Date().toISOString().split("T")[0];
      resDate.value = today;
      resDate.min = today;
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  refreshIcons();
}

// Handle Reservation Form Submit
function handleReservationSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("resCustName").value.trim();
  const phone = document.getElementById("resCustPhone").value.trim();
  const date = document.getElementById("resDate").value;
  const time = document.getElementById("resTime").value;
  const seats = document.getElementById("resSeats").value;
  const notes = document.getElementById("resNotes").value.trim();

  const reservationData = {
    id: "RES-" + Date.now(),
    customerName: name,
    phone: phone,
    date: date,
    time: time,
    seats: seats,
    notes: notes,
    createdAt: new Date().toISOString(),
    status: "confirmed"
  };

  // Save to localStorage
  const existingRes = JSON.parse(localStorage.getItem("pos_reservations")) || [];
  existingRes.push(reservationData);
  localStorage.setItem("pos_reservations", JSON.stringify(existingRes));

  alert(`🎉 บันทึกการจองโต๊ะสำเร็จ!\n\nคุณ ${name}\nวันที่: ${date} เวลา: ${time}\nจำนวน: ${seats}\n\nทางร้านครัวลุงหนุ่ยยินดีต้อนรับครับ ขอบคุณครับ ❤️`);
  
  // Reset and return to menu
  e.target.reset();
  switchLiffPage("menu");
}

function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ============================================================================
// 3. Mode Display & Context Banner Controller
// ============================================================================
function setOrderMode(mode) {
  state.orderMode = mode;

  const banner = document.getElementById("orderContextBanner");
  const iconWrap = document.getElementById("contextIconWrap");
  const titleWrap = document.getElementById("contextMainTitle");
  const descWrap = document.getElementById("contextSubDesc");
  const actionsWrap = document.getElementById("contextQuickActions");
  const takeawayForm = document.getElementById("takeawayExtraForm");
  const floatBar = document.getElementById("floatingCartBar");

  if (mode === "dinein") {
    if (banner) {
      banner.className = "order-context-banner dinein";
    }
    
    const changeBtnWrap = document.getElementById("contextChangeBtnWrap");

    if (state.isTableScanned && state.currentTable) {
      if (iconWrap) iconWrap.innerHTML = "🍽️";
      if (titleWrap) titleWrap.innerHTML = `สั่งอาหาร: <b>โต๊ะ ${state.currentTable}</b> <span class="table-verified-badge"><i data-lucide="check-circle-2"></i> สแกนแล้ว</span>`;
      if (descWrap) descWrap.innerText = "อาหารเสิร์ฟที่โต๊ะ • สั่งเพิ่มได้ตลอด";
      if (changeBtnWrap) {
        changeBtnWrap.innerHTML = `
          <button class="context-btn-change" onclick="openTableQrModal()" title="เปลี่ยนโต๊ะ">
            <i data-lucide="refresh-cw"></i> <span>เปลี่ยนโต๊ะ</span>
          </button>
        `;
      }
      if (actionsWrap) {
        actionsWrap.innerHTML = `
          <button class="context-action-btn" onclick="callWaiter()">
            <i data-lucide="bell"></i> <span>เรียกพนักงาน</span>
          </button>
          <button class="context-action-btn bill-action" onclick="requestBill()">
            <i data-lucide="receipt"></i> <span>ขอเช็คบิล</span>
          </button>
        `;
      }
    } else {
      if (iconWrap) iconWrap.innerHTML = "📷";
      if (titleWrap) titleWrap.innerHTML = `<span style="color:#b45309; font-weight:700;">ยังไม่ได้ระบุโต๊ะ</span>`;
      if (descWrap) descWrap.innerText = "แตะด้านล่างเพื่อเลือกโต๊ะหรือสแกน QR";
      if (changeBtnWrap) changeBtnWrap.innerHTML = "";
      if (actionsWrap) {
        actionsWrap.innerHTML = `
          <button class="context-action-btn btn-scan-highlight" onclick="openTableQrModal()" style="width:100%;">
            <i data-lucide="scan-line"></i> <span>แตะเพื่อเลือกโต๊ะ / สแกน QR</span>
          </button>
        `;
      }
    }

    if (takeawayForm) takeawayForm.style.display = "none";
    if (floatBar) floatBar.classList.remove("takeaway-theme");
  } else {
    if (banner) {
      banner.className = "order-context-banner takeaway";
    }
    const changeBtnWrap = document.getElementById("contextChangeBtnWrap");
    if (iconWrap) iconWrap.innerHTML = "🛍️";
    if (titleWrap) titleWrap.innerHTML = `สั่งกลับบ้าน <b>คิว ${state.currentQueue}</b>`;
    if (descWrap) descWrap.innerText = "อาหารบรรจุใส่กล่อง • รอเรียกรับอาหาร";
    if (changeBtnWrap) {
      changeBtnWrap.innerHTML = `
        <button class="context-btn-change" onclick="setOrderMode('dinein')" title="เปลี่ยนเป็นทานที่ร้าน">
          <i data-lucide="utensils"></i> <span>ทานที่ร้าน</span>
        </button>
      `;
    }
    if (actionsWrap) {
      actionsWrap.innerHTML = `
        <button class="context-action-btn tracker-action" onclick="openOrderTrackerModal()" style="width:100%;">
          <i data-lucide="clock"></i> <span>ดูสถานะคิวของฉัน</span>
        </button>
      `;
    }
    if (takeawayForm) takeawayForm.style.display = "block";
    if (floatBar) floatBar.classList.add("takeaway-theme");
  }

  updateHeaderLabels();
  checkActiveOrders();
  refreshIcons();

  if (mode === "takeaway") {
    updateMascotGreeting("takeaway");
  } else if (state.isTableScanned && state.currentTable) {
    updateMascotGreeting("table_confirmed");
  } else {
    updateMascotGreeting("default");
  }
}

function updateHeaderLabels() {
  const cartHeader = document.getElementById("cartModalHeaderTitle");
  if (cartHeader) {
    cartHeader.innerText = state.orderMode === "dinein" 
      ? `ตะกร้าอาหาร (ทานที่ร้าน โต๊ะ ${state.currentTable})` 
      : `ตะกร้าอาหาร (สั่งกลับบ้าน ${state.currentQueue})`;
  }

  const trackerHeader = document.getElementById("trackerModalHeaderTitle");
  if (trackerHeader) {
    trackerHeader.innerText = state.orderMode === "dinein"
      ? `สถานะอาหาร (โต๊ะ ${state.currentTable})`
      : `สถานะอาหาร (สั่งกลับบ้าน ${state.currentQueue})`;
  }
}

// ============================================================================
// 4. Category & Menu Rendering
// ============================================================================
function renderCategoryTabs() {
  const container = document.getElementById("categoryTabsNav");
  container.innerHTML = state.categories.map(cat => `
    <button class="cat-tab-btn ${cat.id === state.selectedCategory ? 'active' : ''}" onclick="selectCategory('${cat.id}')">
      ${cat.name}
    </button>
  `).join("");
}

function selectCategory(catId) {
  state.selectedCategory = catId;
  renderCategoryTabs();
  renderMenuFeed();
}

function handleSearch() {
  renderMenuFeed();
}

function renderMenuFeed() {
  const container = document.getElementById("menuFeed");
  const searchQuery = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();

  let filtered = state.menus.filter(m => {
    const matchCat = state.selectedCategory === "cat-all" || m.categoryId === state.selectedCategory;
    const matchSearch = m.name.toLowerCase().includes(searchQuery) || (m.description && m.description.toLowerCase().includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="utensils" style="width: 48px; height: 48px; margin: 0 auto 0.75rem; opacity: 0.4;"></i>
        <p>ไม่พบรายการอาหารที่ค้นหา</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  // 1. Mandatory Table Scan Gate: If dining in and table is not yet scanned, require scan first!
  if (state.orderMode === "dinein" && !state.isTableScanned) {
    container.innerHTML = `
      <div class="table-gate-container">
        <div class="table-gate-card">
          <div class="gate-mascot-avatar-wrap">
            <img src="logo/logo.jpg" alt="ลุงหนุ่ย" class="gate-mascot-avatar" onerror="this.src='logo/logo.png'">
            <span class="gate-mascot-badge">👨‍🍳 ลุงหนุ่ยยินดีต้อนรับ</span>
          </div>
          <h2 class="gate-title">ยินดีต้อนรับสู่ ครัวลุงหนุ่ย</h2>
          <p class="gate-desc">
            สวัสดีครับ! กรุณาระบุโต๊ะของคุณก่อนเลือกอาหาร เพื่อให้ลุงเสิร์ฟอาหารถึงโต๊ะและเช็คบิลได้ถูกต้องครับ ❤️
          </p>

          <div class="table-quick-select-box" style="margin-bottom: 1.25rem;">
            <div class="quick-select-label">
              <i data-lucide="layout-grid"></i> แตะเลือกหมายเลขโต๊ะของคุณได้ทันที:
            </div>
            <div class="table-numbers-grid">
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('1')">โต๊ะ 1</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('2')">โต๊ะ 2</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('3')">โต๊ะ 3</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('4')">โต๊ะ 4</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('5')">โต๊ะ 5</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('6')">โต๊ะ 6</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('7')">โต๊ะ 7</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('8')">โต๊ะ 8</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('9')">โต๊ะ 9</button>
              <button type="button" class="btn-num-table" onclick="confirmScannedTable('10')">โต๊ะ 10</button>
            </div>
          </div>
          
          <button type="button" class="btn-gate-scan-primary" onclick="openTableQrModal(true)">
            <i data-lucide="scan-line"></i>
            <span>เปิดสแกนเนอร์สแกน QR โต๊ะ</span>
          </button>
          
          <div class="gate-divider"><span>หรือ</span></div>
          
          <button type="button" class="btn-gate-takeaway" onclick="switchToTakeawayFromModal()">
            <i data-lucide="shopping-bag"></i>
            <span>ไม่ได้นั่งโต๊ะ • สั่งกลับบ้าน (Takeaway)</span>
          </button>
        </div>
      </div>
    `;
    refreshIcons();
    return;
  }

  const cardsHtml = filtered.map(item => {
    const optionsList = item.options ? item.options.split(",").map(o => o.trim()).filter(Boolean) : [];
    let extraPrices = optionsList.map(opt => parseOptionPrice(opt, item.price));
    let maxExtra = Math.max(0, ...extraPrices);
    let priceDisplay = `฿${item.price.toFixed(2)}`;
    if (maxExtra > 0) {
      priceDisplay = `฿${item.price.toFixed(0)} - ฿${(item.price + maxExtra).toFixed(0)}`;
    }

    return `
    <article class="food-card ${!item.isAvailable ? 'out-of-stock' : ''}" onclick="openCustomizeModal('${item.id}')">
      <div class="food-card-img-wrap">
        <img src="${resolveImageUrl(item.imageUrl)}" alt="${item.name}" class="food-card-img" data-local="${(item.imageUrl || '').replace(/^images\//, '').replace(/^image\//, '')}" onerror="this.onerror=null; if(this.dataset.local){this.src='images/' + this.dataset.local;}else{this.src='logo/logo.png';}">
        ${!item.isAvailable ? '<div class="food-stock-badge">หมดชั่วคราว</div>' : ''}
      </div>
      <div class="food-card-info">
        <div>
          <h3 class="food-title">${item.name}</h3>
          <p class="food-desc">${item.description || ''}</p>
        </div>
        <div class="food-price-row">
          <span class="food-price">${priceDisplay}</span>
          ${item.isAvailable ? `
            <button class="btn-add-circle" onclick="event.stopPropagation(); openCustomizeModal('${item.id}')" title="สั่งเมนูนี้">
              <i data-lucide="plus"></i>
            </button>
          ` : ''}
        </div>
      </div>
    </article>
  `;
  }).join("");

  container.innerHTML = cardsHtml;
  refreshIcons();
}

// Helper to extract option price adjustment e.g. (+180), (+฿10), (400.-), (฿400)
function parseOptionPrice(optText, basePrice = 0) {
  if (!optText) return 0;
  
  // 1. Relative increment format: (+10), (+฿10), (+20)
  const relMatch = optText.match(/\(\s*\+\s*฿?(\d+)\s*\)/);
  if (relMatch) {
    return parseFloat(relMatch[1]);
  }

  // 2. Free keyword
  if (optText.includes("ฟรี")) {
    return 0;
  }

  // 3. Absolute price format in options: e.g. "400.-", "฿400", "20.-", "380.-"
  const absMatch = optText.match(/(?:฿\s*(\d+)|(\d+)\s*(?:\.-|บาท))/);
  if (absMatch) {
    const parsedPrice = parseFloat(absMatch[1] || absMatch[2]);
    if (parsedPrice >= basePrice) {
      return parsedPrice - basePrice;
    }
    if (basePrice === 0) {
      return parsedPrice;
    }
  }

  return 0;
}

// ============================================================================
// 5. Customization Modal & Dynamic Size Pricing
// ============================================================================
function openCustomizeModal(itemId) {
  // If dine-in and table has not been scanned yet, prompt QR scanning first!
  if (state.orderMode === "dinein" && !state.isTableScanned) {
    state.pendingCustomItemId = itemId;
    openTableQrModal();
    return;
  }

  const item = state.menus.find(m => m.id === itemId);
  if (!item || !item.isAvailable) return;

  state.activeCustomItem = item;
  state.customQty = 1;

  const container = document.getElementById("customizeModalBody");
  const optionsList = item.options ? item.options.split(",").map(o => o.trim()).filter(Boolean) : [];
  const isDrink = item.categoryId === "cat-alcohol" || item.categoryId === "cat-mixer" || item.categoryId === "cat-drink-promo";

  let optionsHtml = "";
  if (optionsList.length > 0) {
    const sectionTitle = isDrink ? "เลือกขนาด / แพ็กเกจ" : "ระดับความเผ็ด / ตัวเลือกพิเศษ";

    optionsHtml = `
      <div class="custom-section-title">${sectionTitle} <span class="text-danger">*</span></div>
      <div class="option-pill-group">
        ${optionsList.map((opt, idx) => {
          const isSelected = idx === 0;
          return `
            <label class="option-pill-label ${isSelected ? 'selected' : ''}">
              <input type="radio" name="customOption" value="${opt}" ${isSelected ? 'checked' : ''} onchange="handleOptionSelect(this)">
              <span>${opt}</span>
            </label>
          `;
        }).join("")}
      </div>
    `;
  }

  // Hide cook note for drinks
  let noteSectionHtml = "";
  if (!isDrink) {
    noteSectionHtml = `
      <div class="custom-section-title">หมายเหตุเพิ่มเติมถึงกุ๊กครัวลุงหนุ่ย</div>
      <textarea id="customItemNote" class="special-note-input" rows="2" placeholder="เช่น ไม่ใส่ผักชี, ไม่ใส่ชูรส, ขอพริกน้ำปลา..."></textarea>
    `;
  }

  container.innerHTML = `
    <div class="custom-item-hero">
      <img src="${item.imageUrl || 'images/somtum_thai_egg.jpg'}" alt="${item.name}" class="custom-hero-img" onerror="this.src='logo/logo.png'">
      <div>
        <h3 style="font-size:1.05rem; font-weight:700;">${item.name}</h3>
        <p style="font-size:0.8rem; color:#64748b; margin-top:0.25rem;">${item.description || ''}</p>
        <div style="font-size:1.15rem; font-weight:800; color:var(--primary); margin-top:0.35rem;" id="customModalHeroPrice">฿${item.price.toFixed(2)}</div>
      </div>
    </div>

    ${optionsHtml}
    ${noteSectionHtml}
  `;

  updateCustomModalFooter();
  openModal("customizeModal");
}

function handleOptionSelect(inputEl) {
  document.querySelectorAll(".option-pill-label").forEach(l => l.classList.remove("selected"));
  inputEl.closest(".option-pill-label").classList.add("selected");
  updateCustomModalFooter();
}

function adjustCustomModalQty(delta) {
  state.customQty = Math.max(1, state.customQty + delta);
  updateCustomModalFooter();
}

function updateCustomModalFooter() {
  if (!state.activeCustomItem) return;

  const selectedOpt = document.querySelector('input[name="customOption"]:checked')?.value || "";
  const extraPrice = parseOptionPrice(selectedOpt, state.activeCustomItem.price);
  const unitPrice = state.activeCustomItem.price + extraPrice;
  const totalPrice = unitPrice * state.customQty;

  const heroPriceEl = document.getElementById("customModalHeroPrice");
  if (heroPriceEl) {
    heroPriceEl.innerText = `฿${unitPrice.toFixed(2)}`;
  }

  const modalQtyEl = document.getElementById("customModalQty");
  if (modalQtyEl) {
    modalQtyEl.innerText = state.customQty;
  }

  const modalTotalEl = document.getElementById("customModalTotalPrice");
  if (modalTotalEl) {
    modalTotalEl.innerText = `฿${totalPrice.toFixed(2)}`;
  }
}

function confirmAddToCartFromModal() {
  if (!state.activeCustomItem) return;

  const selectedOpt = document.querySelector('input[name="customOption"]:checked')?.value || "";
  const note = document.getElementById("customItemNote")?.value.trim() || "";
  const extraPrice = parseOptionPrice(selectedOpt, state.activeCustomItem.price);
  const finalUnitPrice = state.activeCustomItem.price + extraPrice;

  const existing = state.cart.find(c => c.id === state.activeCustomItem.id && c.options === selectedOpt && c.note === note && c.price === finalUnitPrice);

  if (existing) {
    existing.qty += state.customQty;
  } else {
    state.cart.push({
      id: state.activeCustomItem.id,
      name: state.activeCustomItem.name,
      price: finalUnitPrice,
      qty: state.customQty,
      options: selectedOpt,
      note: note,
      imageUrl: state.activeCustomItem.imageUrl
    });
  }

  closeModal("customizeModal");
  updateCartUI();
  navigator.vibrate?.(40);
}

// ============================================================================
// 6. Cart Management & Floating Bar
// ============================================================================
function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const floatBar = document.getElementById("floatingCartBar");
  const floatCount = document.getElementById("floatCartItemCount");
  const floatCountText = document.getElementById("floatCartItemCountText");
  const floatPrice = document.getElementById("floatCartTotalPrice");
  const mascotWidget = document.getElementById("mascotFloatingWidget");

  if (totalCount > 0) {
    if (floatBar) floatBar.style.display = "flex";
    if (floatCount) floatCount.innerText = totalCount;
    if (floatCountText) floatCountText.innerText = totalCount;
    if (floatPrice) floatPrice.innerText = `฿${totalPrice.toFixed(2)}`;
    if (mascotWidget) mascotWidget.classList.add("has-cart");
  } else {
    if (floatBar) floatBar.style.display = "none";
    if (mascotWidget) mascotWidget.classList.remove("has-cart");
  }
}

function openCartModal() {
  const container = document.getElementById("cartModalItemsContainer");
  const subtotalEl = document.getElementById("cartModalSubtotal");
  const grandTotalEl = document.getElementById("cartModalGrandTotal");
  const takeawayForm = document.getElementById("takeawayExtraForm");
  const btnSubmit = document.getElementById("btnSubmitOrder");

  updateHeaderLabels();

  if (state.orderMode === "takeaway") {
    if (takeawayForm) takeawayForm.style.display = "block";
    btnSubmit.classList.add("takeaway-btn");
    btnSubmit.innerHTML = `<i data-lucide="send"></i> ยืนยันสั่งกลับบ้าน (รับคิว ${state.currentQueue})`;
  } else {
    if (takeawayForm) takeawayForm.style.display = "none";
    btnSubmit.classList.remove("takeaway-btn");
    btnSubmit.innerHTML = `<i data-lucide="send"></i> ยืนยันสั่งอาหารเข้าครัวลุงหนุ่ย`;
  }

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; margin: 0 auto 0.75rem; opacity: 0.4;"></i>
        <p>ยังไม่มีรายการอาหารในตะกร้า</p>
      </div>
    `;
    subtotalEl.innerText = "฿0.00";
    grandTotalEl.innerText = "฿0.00";
    document.getElementById("cartSheetSummary").style.display = "none";
  } else {
    document.getElementById("cartSheetSummary").style.display = "block";
    const total = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    subtotalEl.innerText = `฿${total.toFixed(2)}`;
    grandTotalEl.innerText = `฿${total.toFixed(2)}`;

    container.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-item-row">
        <div style="flex:1; padding-right:0.75rem;">
          <div class="cart-item-title">${item.name}</div>
          ${item.options ? `<div class="cart-item-sub">⚡ ${item.options}</div>` : ''}
          ${item.note ? `<div class="cart-item-note">💬 ${item.note}</div>` : ''}
          <div style="font-weight:700; color:var(--primary); font-size:0.9rem; margin-top:0.25rem;">฿${(item.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="qty-stepper">
          <button type="button" class="stepper-btn" onclick="adjustCartItemQty(${idx}, -1)"><i data-lucide="minus"></i></button>
          <span class="stepper-value">${item.qty}</span>
          <button type="button" class="stepper-btn" onclick="adjustCartItemQty(${idx}, 1)"><i data-lucide="plus"></i></button>
        </div>
      </div>
    `).join("");
  }

  refreshIcons();
  openModal("cartModal");
  const scrollEl = document.getElementById("cartModalScrollBody");
  if (scrollEl) scrollEl.scrollTop = 0;
}

function handleNavOrderClick() {
  if (state.cart && state.cart.length > 0) {
    openCartModal();
  } else {
    switchLiffPage("order");
    showNotificationToast("🛒 ตะกร้ายังว่างอยู่ แตะเลือกเมนูอาหารเพื่อสั่งได้เลยครับ");
  }
}

function adjustCartItemQty(index, delta) {
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  openCartModal();
  updateCartUI();
}

function clearCart() {
  if (state.cart.length === 0) return;
  if (confirm("ต้องการล้างรายการอาหารในตะกร้าทั้งหมดใช่หรือไม่?")) {
    state.cart = [];
    openCartModal();
    updateCartUI();
  }
}

// ============================================================================
// 7. Submit Order (Dine-in vs. Takeaway)
// ============================================================================
function submitOrder() {
  if (state.cart.length === 0) return;

  // Verify that table is scanned for dine-in orders
  if (state.orderMode === "dinein" && (!state.isTableScanned || !state.currentTable)) {
    alert("⚠️ กรุณาสแกน QR Code ประจำโต๊ะก่อนสั่งอาหาร เพื่อให้พนักงานเสิร์ฟอาหารและคิดเงินได้ถูกต้องครับ");
    openTableQrModal();
    return;
  }

  const total = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const isTakeaway = state.orderMode === "takeaway";

  let custName = "";
  let custPhone = "";
  let packaging = [];

  if (isTakeaway) {
    custName = document.getElementById("custNameInput")?.value.trim() || "";
    custPhone = document.getElementById("custPhoneInput")?.value.trim() || "";
    if (document.getElementById("chkPlasticCutlery")?.checked) packaging.push("รับช้อนส้อมพลาสติก");
    if (document.getElementById("chkSeparateSauce")?.checked) packaging.push("แยกน้ำจิ้ม/น้ำส้มตำ");
  }

  const newOrder = {
    id: "ORD-" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + "-" + Math.floor(100 + Math.random() * 900),
    orderType: state.orderMode, // "dinein" | "takeaway"
    tableId: isTakeaway ? "takeaway" : ("t-" + state.currentTable),
    tableName: isTakeaway ? state.currentQueue : state.currentTable,
    customerName: custName,
    customerPhone: custPhone,
    packagingNotes: packaging.join(", "),
    createdAt: new Date().toISOString(),
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "promptpay",
    items: JSON.parse(JSON.stringify(state.cart)),
    subtotal: total,
    total: total
  };

  // 1. Save to LocalStorage
  let existingOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  existingOrders.unshift(newOrder);
  localStorage.setItem("pos_orders", JSON.stringify(existingOrders));

  // 2. Mark table as occupied only if Dine-in
  if (!isTakeaway) {
    let existingTables = JSON.parse(localStorage.getItem("pos_tables")) || DEFAULT_TABLES;
    const targetTable = existingTables.find(t => 
      t.id === ("t-" + state.currentTable) || 
      t.id === state.currentTable || 
      t.name === state.currentTable || 
      t.name === ("โต๊ะ " + state.currentTable) ||
      String(t.name).replace(/^โต๊ะ\s*/, '') === String(state.currentTable).replace(/^โต๊ะ\s*/, '')
    );
    if (targetTable) {
      targetTable.status = "occupied";
      localStorage.setItem("pos_tables", JSON.stringify(existingTables));
    }
  }

  // 3. Try sending to Backend REST API
  fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newOrder)
  }).catch(() => console.log("Local-only mode"));

  // 4. Play success audio
  const audio = document.getElementById("orderSuccessSound");
  if (audio) audio.play().catch(() => {});

  // 5. Clear Cart & Close Modal
  state.cart = [];
  closeModal("cartModal");
  updateCartUI();
  checkActiveOrders();

  if (isTakeaway) {
    alert(`🎉 สั่งอาหารกลับบ้านสำเร็จ!\n\nหมายเลขคิวของคุณคือ: [ ${state.currentQueue} ]\nกรุณารอฟังเสียงเรียกคิวเพื่อรับอาหารครับ 🛍️👨‍🍳`);
    // Prompt to pay via PromptPay immediately for takeaway
    requestBill();
  } else {
    alert(`🎉 สั่งอาหารสำเร็จ!\n\nออเดอร์ของโต๊ะ ${state.currentTable} ถูกส่งไปยังกุ๊กครัวลุงหนุ่ยเรียบร้อยแล้วครับ 👨‍🍳`);
  }
}

// ============================================================================
// 8. Live Order Tracker & Active Status
// ============================================================================
function checkActiveOrders() {
  const allOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  const targetId = state.orderMode === "dinein" ? state.currentTable : state.currentQueue;
  const activeOrders = allOrders.filter(o => 
    (o.tableName === targetId || o.tableId === ("t-" + targetId) || o.tableId === targetId || o.tableName === ("โต๊ะ " + targetId)) && 
    o.paymentStatus === "unpaid"
  );

  const dot = document.getElementById("activeOrdersDot");
  if (dot) {
    dot.style.display = activeOrders.length > 0 ? "block" : "none";
  }
}

function openOrderTrackerModal() {
  const allOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  const targetId = state.orderMode === "dinein" ? state.currentTable : state.currentQueue;
  const activeOrders = allOrders.filter(o => 
    (o.tableName === targetId || o.tableId === ("t-" + targetId) || o.tableId === targetId || o.tableName === ("โต๊ะ " + targetId)) && 
    o.paymentStatus === "unpaid"
  );
  
  const container = document.getElementById("trackerModalBody");
  const totalDisplay = document.getElementById("trackerGrandTotalDisplay");

  updateHeaderLabels();

  if (activeOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <i data-lucide="clipboard-list" style="width: 48px; height: 48px; margin: 0 auto 0.75rem; opacity: 0.4;"></i>
        <p>ยังไม่มีรายการอาหารที่สั่งในขณะนี้</p>
      </div>
    `;
    totalDisplay.innerText = "฿0.00";
  } else {
    const grandTotal = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    totalDisplay.innerText = `฿${grandTotal.toFixed(2)}`;

    const statusMap = {
      pending: '<span class="tracker-status-badge status-pending">🕒 รอดำเนินการ</span>',
      cooking: '<span class="tracker-status-badge status-cooking">🔥 กำลังปรุงอาหาร</span>',
      served: '<span class="tracker-status-badge status-served">🍽️ พร้อมรับ/เสิร์ฟแล้ว</span>',
      completed: '<span class="tracker-status-badge status-completed">✅ ชำระเงินแล้ว</span>'
    };

    container.innerHTML = activeOrders.map((ord, idx) => `
      <div class="tracker-ticket ${ord.orderType === 'takeaway' ? 'takeaway-ticket' : ''}">
        <div class="tracker-ticket-header">
          <div>
            <b>${ord.orderType === 'takeaway' ? '🛍️ สั่งกลับบ้าน' : '🍽️ ทานที่ร้าน'} รอบที่ ${idx + 1}</b>
            <div style="font-size:0.75rem; color:#64748b;">⏱️ ${new Date(ord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
            ${ord.customerName ? `<div style="font-size:0.75rem; color:#ea580c;">ผู้สั่ง: ${ord.customerName} (${ord.tableName})</div>` : ''}
          </div>
          <div>${statusMap[ord.status] || ord.status}</div>
        </div>
        <div>
          ${ord.items.map(i => `
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:0.25rem 0;">
              <div>
                <b>${i.name}</b> x ${i.qty}
                ${i.options ? `<div style="font-size:0.75rem; color:var(--primary);">${i.options}</div>` : ''}
              </div>
              <div>฿${(i.price * i.qty).toFixed(2)}</div>
            </div>
          `).join("")}
        </div>
        ${ord.packagingNotes ? `<div style="font-size:0.75rem; color:#64748b; margin-top:0.35rem;">📦 ${ord.packagingNotes}</div>` : ''}
        <div style="text-align:right; font-weight:700; font-size:0.9rem; color:var(--primary); margin-top:0.4rem; border-top:1px dashed #e2e8f0; padding-top:0.35rem;">
          รวมรอบนี้: ฿${ord.total.toFixed(2)}
        </div>
      </div>
    `).join("");
  }

  refreshIcons();
  openModal("trackerModal");
}

// ============================================================================
// 9. Service Calls & PromptPay Bill Generation
// ============================================================================
function callWaiter() {
  alert(`🔔 เรียกพนักงานเรียบร้อย!\n\nพนักงานกำลังเดินทางมาให้บริการที่ โต๊ะ ${state.currentTable} ครับ`);
}

function requestBill() {
  const allOrders = JSON.parse(localStorage.getItem("pos_orders")) || [];
  const targetId = state.orderMode === "dinein" ? state.currentTable : state.currentQueue;
  const activeOrders = allOrders.filter(o => 
    (o.tableName === targetId || o.tableId === ("t-" + targetId) || o.tableId === targetId || o.tableName === ("โต๊ะ " + targetId)) && 
    o.paymentStatus === "unpaid"
  );

  const total = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  document.getElementById("billMerchantName").innerText = state.settings.shopName;
  document.getElementById("billTargetDisplay").innerText = state.orderMode === "dinein"
    ? `โต๊ะ ${state.currentTable} • ยอดชำระสุทธิ`
    : `คิวสั่งกลับบ้าน ${state.currentQueue} • ยอดชำระสุทธิ`;
  document.getElementById("billPayAmount").innerText = `฿${total.toFixed(2)}`;

  const qrContainer = document.getElementById("customerBillQRCode");
  qrContainer.innerHTML = "";

  if (total > 0 && typeof generatePromptPayPayload === "function") {
    const payload = generatePromptPayPayload(state.settings.promptpayId, total);
    new QRCode(qrContainer, {
      text: payload,
      width: 170,
      height: 170,
      colorDark: "#002d62",
      colorLight: "#ffffff"
    });
  } else {
    qrContainer.innerHTML = `<p style="padding:1.5rem; color:#64748b; font-size:0.85rem;">ไม่มีรายการค้างชำระ</p>`;
  }

  closeModal("trackerModal");
  openModal("billModal");
}

// ============================================================================
// 10. Table QR Code Scanner & Table Verification Controller
// ============================================================================
let html5QrScanner = null;
let isCameraActive = false;

function openTableQrModal() {
  openModal("tableQrModal");

  // Check LINE LIFF QR scanning capability
  const btnLiff = document.getElementById("btnLiffScan");
  if (btnLiff) {
    if (window.liff && (liff.scanCodeV2 || liff.scanCode)) {
      btnLiff.style.display = "inline-flex";
    } else {
      btnLiff.style.display = "none";
    }
  }

  // NOTE: Do NOT auto-start camera automatically!
  // Let the user tap the scan button or choose table number directly to avoid scary browser permission popups.
}

function closeTableQrModal() {
  stopQrCamera();
  closeModal("tableQrModal");
}

function startQrCamera() {
  const qrReaderEl = document.getElementById("qrReader");
  const statusEl = document.getElementById("qrScanStatusMsg");
  const btnToggleText = document.getElementById("btnToggleQrCameraText");

  if (!qrReaderEl) return;

  if (typeof Html5Qrcode === "undefined") {
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.innerHTML = `<span style="color:#d97706;">⚠️ สแกนเนอร์ไม่พร้อมใช้งาน กรุณาเลือกหมายเลขโต๊ะด้านบนได้เลยครับ</span>`;
    }
    return;
  }

  // Stop & clear previous instance completely to prevent dual cameras glitch!
  stopQrCamera();
  qrReaderEl.innerHTML = "";
  qrReaderEl.style.display = "block";

  try {
    html5QrScanner = new Html5Qrcode("qrReader");
  } catch (e) {
    console.log("Html5Qrcode instance error:", e);
    return;
  }

  if (statusEl) {
    statusEl.style.display = "block";
    statusEl.innerHTML = `<span>📷 กำลังเปิดกล้อง... เล็งไปที่ QR Code บนโต๊ะ</span>`;
  }

  html5QrScanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0
    },
    (decodedText) => {
      // Successfully scanned a QR Code!
      stopQrCamera();
      handleScannedQrResult(decodedText);
    },
    () => {
      // Continuous scan frame, ignore
    }
  ).then(() => {
    isCameraActive = true;
    if (btnToggleText) btnToggleText.innerText = "ปิดกล้องสแกน";
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#16a34a; font-weight:600;">🟢 กล้องพร้อมทำงาน เล็งไปที่ QR Code บนโต๊ะ</span>`;
    }
  }).catch((err) => {
    isCameraActive = false;
    if (btnToggleText) btnToggleText.innerText = "เปิดกล้องสแกน QR Code";
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#64748b;">💡 หากเปิดกล้องไม่ได้ สามารถแตะเลือกหมายเลขโต๊ะด้านบนได้ทันที</span>`;
    }
    console.log("QR Camera start error:", err);
  });
}

function stopQrCamera() {
  const btnToggleText = document.getElementById("btnToggleQrCameraText");
  const qrReaderEl = document.getElementById("qrReader");
  const statusEl = document.getElementById("qrScanStatusMsg");

  if (html5QrScanner && isCameraActive) {
    try {
      html5QrScanner.stop().then(() => {
        isCameraActive = false;
        if (btnToggleText) btnToggleText.innerText = "เปิดกล้องสแกน QR Code";
        try { html5QrScanner.clear(); } catch(e) {}
        if (qrReaderEl) {
          qrReaderEl.innerHTML = "";
          qrReaderEl.style.display = "none";
        }
        if (statusEl) statusEl.style.display = "none";
      }).catch(() => {
        isCameraActive = false;
        if (btnToggleText) btnToggleText.innerText = "เปิดกล้องสแกน QR Code";
        if (qrReaderEl) {
          qrReaderEl.innerHTML = "";
          qrReaderEl.style.display = "none";
        }
      });
    } catch(e) {
      isCameraActive = false;
    }
  } else {
    isCameraActive = false;
    if (btnToggleText) btnToggleText.innerText = "เปิดกล้องสแกน QR Code";
    if (qrReaderEl) {
      qrReaderEl.innerHTML = "";
      qrReaderEl.style.display = "none";
    }
    if (statusEl) statusEl.style.display = "none";
  }
}

function toggleQrCamera() {
  if (isCameraActive) {
    stopQrCamera();
    const statusEl = document.getElementById("qrScanStatusMsg");
    if (statusEl) statusEl.innerHTML = `<span>กล้องปิดอยู่ (กดเพื่อเปิดกล้อง)</span>`;
  } else {
    startQrCamera();
  }
}

function triggerLiffScan() {
  if (window.liff) {
    const scanFn = liff.scanCodeV2 || liff.scanCode;
    if (scanFn) {
      scanFn.call(liff).then(result => {
        if (result && result.value) {
          handleScannedQrResult(result.value);
        }
      }).catch(err => {
        alert("ไม่สามารถเปิดกล้อง LINE ได้: " + (err.message || err));
      });
    }
  }
}

// Robust Table Extraction Parser from scanned QR text/URL
function extractTableFromQR(text) {
  if (!text) return null;
  text = String(text).trim();

  // 1. URL parameter: ?table=X or &table=X
  if (text.includes("table=")) {
    const match = text.match(/[?&]table=([^&#\s]+)/i);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]).trim();
      return decoded.replace(/^โต๊ะ\s*/, '').replace(/^t-/, '');
    }
  }

  // 2. JSON: {"table":"2"} or {"tableName":"2"}
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text);
      const val = parsed.table || parsed.tableName || parsed.tableId;
      if (val) return String(val).trim().replace(/^โต๊ะ\s*/, '').replace(/^t-/, '');
    } catch (e) {}
  }

  // 3. Thai / English text format: "โต๊ะ 2", "Table 3", "t-4"
  const labelMatch = text.match(/(?:โต๊ะ|table|t[-_]?)\s*(\d+|[A-Za-z0-9]+)/i);
  if (labelMatch && labelMatch[1]) {
    return String(labelMatch[1]).trim().replace(/^โต๊ะ\s*/, '').replace(/^t-/, '');
  }

  // 4. Raw number: "1" to "99"
  if (/^\d+$/.test(text)) {
    return text;
  }

  return null;
}

function handleScannedQrResult(decodedText) {
  const table = extractTableFromQR(decodedText);
  if (table) {
    confirmScannedTable(table);
  } else {
    const statusEl = document.getElementById("qrScanStatusMsg");
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#e11d48; font-weight:700;">⚠️ QR Code นี้ไม่ถูกต้อง ไม่พบหมายเลขโต๊ะ กรุณาลองใหม่อีกครั้ง</span>`;
    }
  }
}

function confirmScannedTable(tableNum) {
  const cleanTable = String(tableNum).trim().replace(/^โต๊ะ\s*/, '').replace(/^t-/, '');
  state.currentTable = cleanTable;
  state.isTableScanned = true;
  sessionStorage.setItem("pos_scanned_table", cleanTable);
  localStorage.setItem("pos_scanned_table", cleanTable);

  setOrderMode("dinein");
  closeTableQrModal();
  renderMenuFeed(); // Render menus immediately upon successful table scan!
  updateMascotGreeting("table_confirmed"); // Mascot welcomes this specific table!

  // Play confirmation chime
  const audio = document.getElementById("orderSuccessSound");
  if (audio) audio.play().catch(() => {});

  // Show Toast
  showNotificationToast(`🎉 สแกนสำเร็จ! ยืนยัน [ โต๊ะ ${state.currentTable} ] สำหรับเสิร์ฟและเช็คบิล`);

  // If customer clicked a menu item, open its customization modal now!
  if (state.pendingCustomItemId) {
    const pendingId = state.pendingCustomItemId;
    state.pendingCustomItemId = null;
    setTimeout(() => {
      openCustomizeModal(pendingId);
    }, 200);
  }
}

function switchToTakeawayFromModal() {
  closeTableQrModal();
  setOrderMode("takeaway");
  renderMenuFeed(); // Render menus immediately for takeaway!
  showNotificationToast(`🛍️ เปลี่ยนเป็นโหมดสั่งกลับบ้าน (คิว ${state.currentQueue})`);

  if (state.pendingCustomItemId) {
    const pendingId = state.pendingCustomItemId;
    state.pendingCustomItemId = null;
    openCustomizeModal(pendingId);
  }
}

function showNotificationToast(msg) {
  const toast = document.getElementById("appToastNotification");
  const textEl = document.getElementById("toastMessageText");
  if (toast && textEl) {
    textEl.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }
}

function toggleQrPreviewGrid() {
  const container = document.getElementById("tableQrPreviewContainer");
  if (!container) return;
  if (container.style.display === "none" || !container.style.display) {
    container.style.display = "block";
    renderTableQrPreviewCards();
  } else {
    container.style.display = "none";
  }
}

function renderTableQrPreviewCards() {
  const grid = document.getElementById("qrPreviewGrid");
  if (!grid || grid.children.length > 0) return;

  const tables = state.tables || DEFAULT_TABLES;
  const baseUrl = window.location.href.split('?')[0];

  grid.innerHTML = tables.map(t => `
    <div class="qr-preview-card" onclick="confirmScannedTable('${t.name}')" title="คลิกเพื่อจำลองการสแกนโต๊ะ ${t.name}">
      <strong>โต๊ะ ${t.name}</strong>
      <div class="qr-canvas-holder" id="previewQrHolder_${t.name}"></div>
      <div style="font-size:0.7rem; color:#64748b;">กดเพื่อทดสอบสแกน</div>
    </div>
  `).join("");

  if (typeof QRCode !== "undefined") {
    tables.forEach(t => {
      const holder = document.getElementById(`previewQrHolder_${t.name}`);
      if (holder) {
        new QRCode(holder, {
          text: `${baseUrl}?table=${t.name}`,
          width: 90,
          height: 90,
          colorDark: "#1e293b",
          colorLight: "#ffffff"
        });
      }
    });
  }
}

// ============================================================================
// 11. Modal Utilities
// ============================================================================
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add("active");
  refreshIcons();
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove("active");
}

// ============================================================================
// 12. Mascot "Lung Nui" Controller (Interactive Greeting & Food Tips)
// ============================================================================
const MASCOT_TIPS = [
  "🔥 วันนี้ลุงแนะนำ 'ไก่ย่าง' หนังกรอบเนื้อนุ่ม จิ้มแจ่วรสเด็ด แซ่บอีหลีครับ!",
  "🍲 อากาศแบบนี้ ต้องซด 'ต้มยำทะเลรวมมิตร' หรือ 'ต้มแซ่บกระดูกหมู' ร้อนๆ คล่องคอมากครับ!",
  "🥗 'ส้มตำปูปลาร้า' ปลาร้าต้มสุกสะอาด หอมนัว จัดจ้านสะใจแน่นอนคร้าบ!",
  "🥩 'เสือร้องไห้' ย่างเตาถ่านหอมๆ ติดมันนิดๆ เคี้ยวเพลินจิ้มแจ่วแซ่บๆ สั่งได้เลยนะ!",
  "🥤 อย่าลืมสั่งเครื่องดื่มเย็นๆ ชื่นใจ น้ำดื่ม โค้ก หรือเบียร์วุ้นดับกระหายด้วยนะคร้าบ!",
  "🍳 อาหารตามสั่ง กะเพราเนื้อ กะเพราหมูกรอบ ผัดพริกแกง ลุงผัดจานต่อจานหอมกลิ่นกระทะครับ!",
  "🐟 'เมี่ยงปลาทับทิมเผาเกลือ' ตัวโตๆ เสิร์ฟพร้อมผักสดและน้ำจิ้มซีฟู้ดรสเด็ด ลุงคัดพิเศษเลย!"
];

let currentMascotTipIndex = 0;

function updateMascotGreeting(context = "default") {
  const textEl = document.getElementById("mascotSpeechText");
  const floatMsgEl = document.getElementById("mascotFloatingMsg");

  let msg = "ยินดีต้อนรับครับ! วันนี้ลุงคัดวัตถุดิบสดใหม่ รับประกันรสชาติจัดจ้านทุกจานครับ ❤️";

  if (context === "table_confirmed" && state.currentTable) {
    msg = `🎉 ยินดีต้อนรับ <b>โต๊ะ ${state.currentTable}</b> ครับ! เลือกเมนูอาหารที่ชอบแล้วสั่งได้เลยนะ เดี๋ยวลุงรีบทำให้เสิร์ฟร้อนๆ ถึงโต๊ะครับ 😊`;
  } else if (context === "takeaway") {
    msg = `🛍️ สั่งกลับบ้าน คิว ${state.currentQueue} นะครับ ลุงจะแพ็กใส่กล่องอย่างดี รอเรียกรับอาหารหน้าร้านได้เลยครับ!`;
  } else if (context === "cart_active" && state.cart.length > 0) {
    msg = `🛒 สั่งอาหารไปแล้ว ${state.cart.length} อย่าง แตะ <b>'ดูตะกร้า'</b> ด้านล่างเพื่อส่งออเดอร์เข้าครัวได้เลยครับ!`;
  } else if (!state.isTableScanned && state.orderMode === "dinein") {
    msg = `👋 สวัสดีครับ! ยินดีต้อนรับสู่ครัวลุงหนุ่ย นั่งโต๊ะไหนแตะเลือกหมายเลขโต๊ะได้เลย หรือสแกน QR Code บนโต๊ะนะคร้าบ ❤️`;
  }

  if (textEl) textEl.innerHTML = msg;
  if (floatMsgEl) floatMsgEl.innerHTML = msg;
}

function mascotSpeakNextTip() {
  const textEl = document.getElementById("mascotSpeechText");
  const floatMsgEl = document.getElementById("mascotFloatingMsg");
  const avatarImg = document.querySelector(".mascot-avatar-img");
  const floatAvatarImg = document.querySelector(".mascot-floating-img");

  // Tiny bounce animation on tap
  if (avatarImg) {
    avatarImg.style.transform = "scale(1.2) rotate(-8deg)";
    setTimeout(() => { avatarImg.style.transform = ""; }, 250);
  }
  if (floatAvatarImg) {
    floatAvatarImg.style.transform = "scale(1.25) rotate(-10deg)";
    setTimeout(() => { floatAvatarImg.style.transform = ""; }, 250);
  }

  // Ensure floating bubble box is visible when tapped
  const floatBox = document.getElementById("mascotBubbleBox");
  if (floatBox) floatBox.style.display = "block";

  // Cycle through tips
  currentMascotTipIndex = (currentMascotTipIndex + 1) % MASCOT_TIPS.length;
  const tip = MASCOT_TIPS[currentMascotTipIndex];
  if (textEl) textEl.innerHTML = tip;
  if (floatMsgEl) floatMsgEl.innerHTML = tip;
}

function toggleMascotBubble() {
  const floatBox = document.getElementById("mascotBubbleBox");
  if (!floatBox) return;
  if (floatBox.style.display === "none") {
    floatBox.style.display = "block";
    mascotSpeakNextTip();
  } else {
    floatBox.style.display = "none";
  }
}

function dismissMascotBubble() {
  const card = document.getElementById("mascotGreetingCard");
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "translateY(-10px)";
    setTimeout(() => { card.style.display = "none"; }, 250);
  }
}

