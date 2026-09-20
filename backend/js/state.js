/**
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Shared State & Data Sync Module
 */

const DEFAULT_SHOP_SETTINGS = {
  shopName: "ครัวลุงหนุ่ย (Krua Lung Nui)",
  phone: "089-123-4567",
  address: "ร้านครัวลุงหนุ่ย อร่อยเหมือนกินที่บ้าน",
  receiptFooter: "อร่อยเหมือนกินที่บ้าน • ขอบคุณที่อุดหนุนครัวลุงหนุ่ยครับ 🙏",
  promptpayType: "mobile",
  promptpayId: "0891234567",
  promptpayName: "ครัวลุงหนุ่ย (Krua Lung Nui)",
  lineWebhook: "https://notify-bot.line.me/api/notify",
  serviceCharge: 0,
  vat: 0,
  // Accounting & Cost Control Targets (ครัวลุงหนุ่ย)
  initialCash: 2000,
  targetDailySales: 8000,
  targetFoodCostPct: 35,
  targetLaborCostPct: 18,
  targetNetMarginPct: 15,
  workingDaysPerMonth: 26,
  monthlyFixedCosts: 18000 // ค่าเช่า + ค่าน้ำไฟรายเดือนโดยประมาณสำหรับเฉลี่ยจุดคุ้มทุน (Accrual)
};

const FALLBACK_MENUS = [{"id":"m-rec-1","categoryId":"cat-recommend","name":"ต้มเลือดหมู","description":"น้ำซุปหอมหวานกระดูกหมู เลือดหมูนุ่ม หมูสับก้อน หมูชิ้น ตำลึงสด โรยกระเทียมเจียวหอมกรุ่น","price":50,"imageUrl":"images/tom_luead_moo.jpg","options":"ใส่ทุกอย่าง, ไม่ใส่เครื่องใน, เพิ่มข้าวสวย (+10), พิเศษ (+10)","isAvailable":true},{"id":"m-rec-2","categoryId":"cat-recommend","name":"ข้าวมันไก่","description":"ข้าวมันหอมนุ่มเม็ดสวย ไก่ตอนเนื้อฉ่ำนุ่ม น้ำจิ้มเต้าเจี้ยวขิงสูตรเด็ด เสิร์ฟคู่น้ำซุปร้อนๆ","price":50,"imageUrl":"images/khao_man_gai.jpg","options":"เนื้ออก, เนื้อสะโพก, เนื้อน่อง, พิเศษ (+10)","isAvailable":true},{"id":"m-rec-3","categoryId":"cat-recommend","name":"ก๋วยเตี๋ยวหมู","description":"ก๋วยเตี๋ยวหมูน้ำใสกลมกล่อม หมูแดง หมูสับ ลูกชิ้นหมู เกี๊ยวกรอบ โรยถั่วลิสงคั่วหอม","price":50,"imageUrl":"images/kuay_tiew_moo.jpg","options":"เส้นเล็ก, เส้นใหญ่, เส้นหมี่ขาว, บะหมี่เหลือง, พิเศษ (+10)","isAvailable":true},{"id":"m-ala-1","categoryId":"cat-alacarte","name":"กระเพราหมู","description":"หมูสับ/หมูชิ้นผัดกะเพรารสเด็ดคั่วแห้งพริกกระเทียม ใบกะเพราหอมกรุ่น ราดข้าวสวยร้อนๆ","price":50,"imageUrl":"images/krapow_moo.jpg","options":"หมูสับ, หมูชิ้น, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10)","isAvailable":true},{"id":"m-ala-2","categoryId":"cat-alacarte","name":"กระเพราไก่","description":"เนื้อไก่นุ่มผัดพริกกระเทียมใบกะเพราป่ารสชาติเข้มข้นจัดจ้าน อร่อยเด็ดถึงใจ","price":50,"imageUrl":"images/krapow_gai.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+10)","isAvailable":true},{"id":"m-ala-3","categoryId":"cat-alacarte","name":"กระเพราทะเล","description":"กุ้งสดตัวโต ปลาหมึกกรอบเนื้อเด้ง ผัดกะเพราพริกสดรสจัดจ้าน จัดเต็มซีฟู้ดสดใหม่","price":60,"imageUrl":"images/krapow_talay.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)","isAvailable":true},{"id":"m-ala-4","categoryId":"cat-alacarte","name":"กระเพรารวม","description":"กะเพราเครื่องแน่นรวมมิตร หมู ไก่ กุ้ง หมึก ผัดคลุกเคล้าพริกแห้งและใบกะเพราหอมฟุ้ง","price":60,"imageUrl":"images/krapow_ruam.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)","isAvailable":true},{"id":"m-isa-1","categoryId":"cat-isan","name":"แกงอ่อมหมู","description":"แกงอ่อมสไตล์อีสานแท้ ผักชีลาวหอมๆ มะเขือเปราะ ฟักทอง หมูนุ่ม ซดน้ำซุปหอมข้าวคั่ว","price":80,"imageUrl":"images/gaeng_om_moo.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดแซ่บ, เพิ่มผักชีลาว","isAvailable":true},{"id":"m-isa-2","categoryId":"cat-isan","name":"ลาบเนื้อ ก้อยขม","description":"เนื้อวัวสดคลุกเคล้าพริกป่นคั่วเอง ข้าวคั่วหอม ดีวัวรสขมกำลังดี หอมสะระแหน่และผักไผ่","price":90,"imageUrl":"images/larb_neua_koi_khom.jpg","options":"ลาบสุก, ลาบดิบ, ก้อยขม (ใส่ดี), ไม่ขม","isAvailable":true},{"id":"m-isa-3","categoryId":"cat-isan","name":"ต้มแซ่บ","description":"ต้มแซ่บกระดูกหมูอ่อน/เนื้อเปื่อย น้ำซุปรสเปรี้ยวเผ็ดจี๊ดจ๊าด หอมสมุนไพรข่าตะไคร้ใบมะกรูด","price":80,"imageUrl":"images/tom_saap.jpg","options":"หมูอ่อน, เนื้อเปื่อย, เผ็ดน้อย, เผ็ดจัดจ้าน","isAvailable":true},{"id":"m-isa-4","categoryId":"cat-isan","name":"คอหมูย่าง","description":"สันคอหมูหมักสูตรพิเศษย่างเตาถ่านหอมกรุ่น เนื้อนุ่มฉ่ำ เสิร์ฟพร้อมน้ำจิ้มแจ่วข้าวคั่วพริกป่น","price":80,"imageUrl":"images/kor_moo_yang.jpg","options":"ติดมัน, มันน้อย, เพิ่มน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)","isAvailable":true},{"id":"m-isa-5","categoryId":"cat-isan","name":"ไส้ตัวลวก","description":"ไส้อ่อนหมูสดลวกสุกสะอาดนุ่มเด้ง ไม่เหนียว ไม่คาว โรยกระเทียมเจียว เสิร์ฟคู่น้ำจิ้มซีฟู้ดแจ่วแซ่บ","price":100,"imageUrl":"images/sai_tua_luak.jpg","options":"น้ำจิ้มซีฟู้ด, น้ำจิ้มแจ่ว, รับทั้ง 2 น้ำจิ้ม","isAvailable":true},{"id":"m-isa-6","categoryId":"cat-isan","name":"ลาบทะเล","description":"กุ้งสดและปลาหมึกลวกสุกเด้ง คลุกเคล้าเครื่องลาบอีสาน ข้าวคั่ว มะนาวแท้ พริกป่นหอมจัดจ้าน","price":120,"imageUrl":"images/larb_talay.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-7","categoryId":"cat-isan","name":"ตำปลาร้า","description":"ส้มตำปลาร้าสูตรลุงหนุ่ย น้ำปลาร้าต้มสุกหอมนัว มะละกอกรอบ พริกแห้งพริกสดแซ่บสะใจ","price":50,"imageUrl":"images/somtum_plara.jpg","options":"พริก 2 เม็ด (เผ็ดน้อย), พริก 5 เม็ด (เผ็ดปกติ), พริก 10 เม็ด (เผ็ดมาก), ไม่ใส่ชูรส","isAvailable":true},{"id":"m-isa-8","categoryId":"cat-isan","name":"ตำทะเล","description":"ตำส้มตำเครื่องซีฟู้ด กุ้งสด หมึกสด หอยแมลงภู่ คลุกเคล้าน้ำปลาร้า/ไทย รสเด็ดจัดจ้าน","price":100,"imageUrl":"images/somtum_talay.jpg","options":"ตำปลาร้า, ตำไทย, เผ็ดน้อย, เผ็ดแซ่บจี๊ด","isAvailable":true},{"id":"m-isa-9","categoryId":"cat-isan","name":"ตำกุ้งสด","description":"ส้มตำรสเด็ดใส่กุ้งสดเนื้อหวานเด้ง ปลาร้านัวลึก พริกสด มะนาวแท้ แซ่บถึงเครื่อง","price":70,"imageUrl":"images/somtum_goong_sod.jpg","options":"กุ้งสดดิบ, กุ้งลวกสุก, เผ็ดน้อย, เผ็ดปกติ, เผ็ดพ่นไฟ","isAvailable":true},{"id":"m-isa-10","categoryId":"cat-isan","name":"ตำแตง ตำถั่ว","description":"ตำแตงกวากรอบฉ่ำน้ำ หรือตำถั่วฝักยาวเคี้ยวกรุบกรอบ นัวน้ำปลาร้าสูตรเด็ดลุงหนุ่ย","price":60,"imageUrl":"images/somtum_taeng_thua.jpg","options":"ตำแตง, ตำถั่วฝักยาว, ตำแตง+ถั่วรวม, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-11","categoryId":"cat-isan","name":"ลาบหมู","description":"หมูสับล้วนปรุงรสลาบอีสานแท้ ข้าวคั่วคั่วใหม่ มะนาวสด หอมแดง สะระแหน่ ต้นหอมผักชี","price":80,"imageUrl":"images/larb_moo.jpg","options":"ใส่ตับหมู, ไม่ใส่ตับ, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-12","categoryId":"cat-isan","name":"ตับหวาน","description":"ตับหมูสดลวกสุกกำลังนุ่มฉ่ำ ไม่แข็ง คลุกเครื่องลาบรสเปรี้ยวเค็มเผ็ดหอมข้าวคั่ว","price":80,"imageUrl":"images/tub_whan.jpg","options":"ตับสุกนุ่ม, ตับสุกพอดี, เผ็ดน้อย, เผ็ดปกติ","isAvailable":true},{"id":"m-isa-13","categoryId":"cat-isan","name":"น้ำตกหมู","description":"เนื้อหมูย่างเตาถ่านหั่นชิ้นพอดีคำ คลุกเคล้าน้ำตกสมุนไพร ข้าวคั่วหอม พริกป่น น้ำปลา มะนาวสด","price":80,"imageUrl":"images/nam_tok_moo.jpg","options":"หมูติดมัน, เนื้อล้วน, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-isa-14","categoryId":"cat-isan","name":"เสือร้องไห้","description":"เนื้อวัวส่วนอกติดมันหมักซอสย่างเตาถ่านหอมกรุ่น นุ่มหนึบเคี้ยวเพลิน เสิร์ฟคู่น้ำจิ้มแจ่วรสเด็ด","price":80,"imageUrl":"images/suea_rong_hai.jpg","options":"ติดมัน, มันน้อย, สุกปานกลาง (Medium), สุกทั่ว (Well done)","isAvailable":true},{"id":"m-isa-15","categoryId":"cat-isan","name":"หมูแดดเดียวทอด","description":"เนื้อหมูหมักเครื่องเทศตากแดดจนได้ที่ ทอดร้อนๆ เนื้อนุ่มฉ่ำ รสกลมกล่อม ทานคู่ข้าวเหนียวเด็ดมาก","price":80,"imageUrl":"images/moo_daed_deaw.jpg","options":"พร้อมซอสพริก, พร้อมน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)","isAvailable":true},{"id":"m-ty-1","categoryId":"cat-soup-yum","name":"ต้มยำรวมมิตร","description":"ต้มยำเครื่องแน่น หมู ไก่ กุ้ง หมึก เห็ดฟาง น้ำซุปต้มยำครบรส เปรี้ยว เค็ม เผ็ด หอมพริกเผา","price":120,"imageUrl":"images/tomyum_ruammit.jpg","options":"น้ำข้น, น้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดจัดจ้าน","isAvailable":true},{"id":"m-ty-2","categoryId":"cat-soup-yum","name":"ต้มยำทะเล ข้น/ใส","description":"ต้มยำซีฟู้ด กุ้งแม่น้ำ ปลาหมึกสด หอยแมลงภู่ สมุนไพรไทย ข่า ตะไคร้ ใบมะกรูด มะนาวแท้","price":100,"imageUrl":"images/tomyum_talay.jpg","options":"ต้มยำน้ำข้น, ต้มยำน้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-ty-3","categoryId":"cat-soup-yum","name":"ยำวุ้นเส้น","description":"วุ้นเส้นเหนียวนุ่ม ยำใส่หมูสับ กุ้งสด หมึกสด ถั่วลิสงคั่ว น้ำยำรสเปรี้ยวแซ่บจี๊ดจ๊าด","price":80,"imageUrl":"images/yum_woon_sen.jpg","options":"ยำวุ้นเส้นรวมมิตร, ยำวุ้นเส้นหมูสับล้วน, เผ็ดน้อย, เผ็ดแซ่บ","isAvailable":true},{"id":"m-ty-4","categoryId":"cat-soup-yum","name":"ยำทะเล","description":"ยำซีฟู้ดรวม กุ้งเด้ง ปลาหมึกสดกรอบ หอยแมลงภู่ คลุกน้ำยำรสเด็ดจี๊ดจ๊าด ใส่ขึ้นฉ่ายหอมแดง","price":100,"imageUrl":"images/yum_talay.jpg","options":"เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก","isAvailable":true},{"id":"m-ty-5","categoryId":"cat-soup-yum","name":"กุ้งแช่น้ำปลา","description":"กุ้งสดเนื้อหวานคัดพิเศษ แช่น้ำปลาดี เสิร์ฟพร้อมกระเทียมสด มะระสด และน้ำจิ้มซีฟู้ดมะนาวพริกขี้หนูสวน","price":100,"imageUrl":"images/goong_chae_nampla.jpg","options":"น้ำจิ้มซีฟู้ดราดเลย, แยกน้ำจิ้ม, เพิ่มกระเทียมมะระ","isAvailable":true},{"id":"m-ty-6","categoryId":"cat-soup-yum","name":"เฟรนช์ฟรายส์","description":"มันฝรั่งแท่งทอดกรอบสีทอง กรอบนอกนุ่มใน ไม่อมน้ำมัน โรยเกลือเล็กน้อย เสิร์ฟพร้อมซอสมะเขือเทศและมายองเนส","price":50,"imageUrl":"images/french_fries.jpg","options":"ซอสมะเขือเทศ, ซอสพริก, มายองเนส, รับทุกซอส","isAvailable":true},{"id":"m-pr-1","categoryId":"cat-drink-promo","name":"โปรเบียร์ลีโอ 3 ขวด 230.- (ปกติ 240.-)","description":"สุดคุ้มชุดประหยัด เบียร์ลีโอ 3 ขวดใหญ่ แช่เย็นพร้อมเสิร์ฟ","price":230,"imageUrl":"images/promo_beer_leo_3.jpg","options":"","isAvailable":true},{"id":"m-pr-2","categoryId":"cat-drink-promo","name":"โปรเบียร์ช้าง 3 ขวด 230.- (ปกติ 240.-)","description":"โปรโมชั่นสุดคุ้ม เบียร์ช้างคลาสสิก 3 ขวดใหญ่ เย็นสะใจ","price":230,"imageUrl":"images/promo_beer_chang_3.jpg","options":"","isAvailable":true},{"id":"m-pr-3","categoryId":"cat-drink-promo","name":"โปรเบียร์สิงห์ 3 ขวด 260.- (ปกติ 270.-)","description":"โปรโมชั่นสิงห์ 3 ขวดใหญ่ รสชาติเข้มข้น ดื่มด่ำทุกช่วงเวลา","price":260,"imageUrl":"images/promo_beer_singha_3.jpg","options":"","isAvailable":true},{"id":"m-dp-1","categoryId":"cat-drink-promo","name":"โปรเบียร์สิงห์ 2 ขวด (โปรต้อนรับร้านใหม่)","description":"เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)","price":99,"imageUrl":"images/promo_beer_singha.jpg","options":"","isAvailable":true},{"id":"m-dp-2","categoryId":"cat-drink-promo","name":"เบียร์ช้าง หรือ ลีโอ 2 ขวด (โปรต้อนรับร้านใหม่)","description":"เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)","price":89,"imageUrl":"images/promo_beer_chang_leo.jpg","options":"","isAvailable":true},{"id":"m-dp-3","categoryId":"cat-drink-promo","name":"เบลนด์ 285 ขวดลิตร (โปรต้อนรับร้านใหม่)","description":"แถมฟรีโซดา 4 ขวด และน้ำแข็ง 1 ถัง + แถมฟรีเฟรนช์ฟรายส์ 1 จาน (เสิร์ฟช่วง 16.00–21.00 น. จำกัดโต๊ะละ 1 ชุด)","price":350,"imageUrl":"images/promo_blend285.jpg","options":"","isAvailable":true},{"id":"m-lq-1","categoryId":"cat-alcohol","name":"เบลนด์ 285 (Blend 285)","description":"สุราผสมกลิ่นวิสกี้ รสนุ่ม หอมกลมกล่อม ดื่มง่าย (กลม 300.- / ลิตร 400.-)","price":300,"imageUrl":"images/liquor_blend285.jpg","options":"กลม (700ml) 300.-, ลิตร (1000ml) 400.-","isAvailable":true},{"id":"m-lq-2","categoryId":"cat-alcohol","name":"หงส์ทอง (Hong Thong)","description":"สุราปรุงพิเศษสีย้อมทอง หอมละมุน กลมกล่อม (แบน 200.- / กลม 380.-)","price":200,"imageUrl":"images/liquor_hongthong.jpg","options":"แบน (350ml) 200.-, กลม (700ml) 380.-","isAvailable":true},{"id":"m-lq-3","categoryId":"cat-alcohol","name":"แสงโสม (SangSom)","description":"สุราพิเศษไทย หมักบ่มถังไม้โอ๊ก รสชาติเข้มข้น หอมกรุ่น (แบน 220.- / กลม 400.-)","price":220,"imageUrl":"images/liquor_sangsom.jpg","options":"แบน (350ml) 220.-, กลม (700ml) 400.-","isAvailable":true},{"id":"m-br-1","categoryId":"cat-alcohol","name":"เบียร์สิงห์ (Singha)","description":"เบียร์สิงห์ขวดใหญ่ แช่เย็นเจี๊ยบ รสชาติเข้มข้น หอมกรุ่น (ขวดละ 90.-)","price":90,"imageUrl":"images/beer_singha.jpg","options":"","isAvailable":true},{"id":"m-br-2","categoryId":"cat-alcohol","name":"เบียร์ลีโอ (Leo)","description":"เบียร์ลีโอขวดใหญ่ แช่เย็น รสนุ่ม ดื่มง่าย ยอดนิยม (ขวดละ 80.-)","price":80,"imageUrl":"images/beer_leo.jpg","options":"","isAvailable":true},{"id":"m-br-3","categoryId":"cat-alcohol","name":"เบียร์ช้าง (Chang)","description":"เบียร์ช้างคลาสสิกขวดใหญ่ เย็นสดชื่น สะใจทุกแก้ว (ขวดละ 80.-)","price":80,"imageUrl":"images/beer_chang.jpg","options":"","isAvailable":true},{"id":"m-mx-1","categoryId":"cat-mixer","name":"โซดา (Soda)","description":"โซดาสิงห์ขวดแก้ว ซ่าสดชื่นยาวนาน (ขวดละ 20 บาท)","price":20,"imageUrl":"images/mixer_soda.jpg","options":"","isAvailable":true},{"id":"m-mx-2","categoryId":"cat-mixer","name":"น้ำเปล่า (Water)","description":"น้ำดื่มสะอาดบริสุทธิ์ แช่เย็นสดชื่น (ขวดละ 10 บาท)","price":10,"imageUrl":"images/mixer_water.jpg","options":"","isAvailable":true},{"id":"m-mx-3","categoryId":"cat-mixer","name":"น้ำแข็ง (Ice Bucket)","description":"น้ำแข็งถังแรกของทุกโต๊ะไม่คิดเงิน (ฟรี) • ถังต่อไปคิดถังละ 20 บาท","price":0,"imageUrl":"images/mixer_ice.jpg","options":"ถังแรกประจำโต๊ะ (ฟรี), สั่งเพิ่มถังต่อไป 20.-","isAvailable":true}];
const FALLBACK_CATEGORIES = [{"id":"cat-all","name":"ทั้งหมด"},{"id":"cat-recommend","name":"🌟 รายการแนะนำ"},{"id":"cat-alacarte","name":"🍳 อาหารตามสั่ง"},{"id":"cat-isan","name":"🌶️ อาหารอีสาน ส้มตำ ลาบ ก้อย"},{"id":"cat-soup-yum","name":"🍲 อาหารประเภทต้ม ยำ"},{"id":"cat-drink-promo","name":"🔥 โปรต้อนรับร้านใหม่ (16.00-21.00)"},{"id":"cat-alcohol","name":"🍾 เหล้า & เบียร์"},{"id":"cat-mixer","name":"🧊 น้ำดื่ม & ของผสม"}];
const FALLBACK_TABLES = [
  { id: "t-1", name: "โต๊ะ 1", status: "available" },
  { id: "t-2", name: "โต๊ะ 2", status: "available" },
  { id: "t-3", name: "โต๊ะ 3", status: "available" },
  { id: "t-4", name: "โต๊ะ 4", status: "available" },
  { id: "t-5", name: "โต๊ะ 5", status: "available" },
  { id: "t-6", name: "โต๊ะ 6", status: "available" },
  { id: "t-7", name: "โต๊ะ 7", status: "available" },
  { id: "t-8", name: "โต๊ะ 8", status: "available" },
  { id: "t-9", name: "โต๊ะ 9", status: "available" },
  { id: "t-10", name: "โต๊ะ 10", status: "available" }
];

var DEFAULT_CATEGORIES = (typeof window !== 'undefined' && window.DEFAULT_CATEGORIES && window.DEFAULT_CATEGORIES.length > 0)
  ? window.DEFAULT_CATEGORIES
  : FALLBACK_CATEGORIES;

var DEFAULT_MENUS = (typeof window !== 'undefined' && window.DEFAULT_MENUS && window.DEFAULT_MENUS.length > 0)
  ? window.DEFAULT_MENUS
  : FALLBACK_MENUS;

var DEFAULT_TABLES = (typeof window !== 'undefined' && window.DEFAULT_TABLES && window.DEFAULT_TABLES.length > 0)
  ? window.DEFAULT_TABLES
  : FALLBACK_TABLES;

// Menu Version Identifier to auto-sync fresh menus without clearing browser cache manually
const MENU_SCHEMA_VERSION = "krua_lung_nui_v7_auto_reset";

if (localStorage.getItem("pos_menu_version") !== MENU_SCHEMA_VERSION) {
  localStorage.setItem("pos_menus", JSON.stringify(DEFAULT_MENUS));
  localStorage.setItem("pos_categories", JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem("pos_menu_version", MENU_SCHEMA_VERSION);
}

const DEFAULT_LOANS = [
  {
    id: "L1",
    lenderName: "สินเชื่อหมุนเวียนพ่อค้าแม่ค้า 1",
    principalAmount: 30000,
    totalPayable: 36000,
    dailyInstallment: 600,
    totalTerms: 60,
    termsPaid: 15,
    balanceRemaining: 27000,
    status: "active",
    startDate: "2026-08-25",
    notes: "ส่งวันละ 600 บาท (หักผ่านรายจ่ายประจำวัน)"
  }
];

const DEFAULT_DAILY_RECORDS = [
  {
    id: "DR-20260912",
    recordDate: "2026-09-12",
    billCount: 42,
    actualCashCounted: 4650,
    systemCashCalculated: 4650,
    cashDiff: 0,
    status: "closed",
    notes: "ปิดกะรอบค่ำเรียบร้อย ยอดเงินสดตรง"
  },
  {
    id: "DR-20260913",
    recordDate: "2026-09-13",
    billCount: 38,
    actualCashCounted: 5200,
    systemCashCalculated: 5200,
    cashDiff: 0,
    status: "open",
    notes: "รอบวันนี้กำลังเปิดอยู่"
  }
];

const DEFAULT_TRANSACTIONS = [
  // ยอดขาย 2026-09-13
  {
    id: "TXN-20260913-01",
    dailyRecordId: "DR-20260913",
    type: "INCOME",
    paymentChannel: "CASH",
    category: "sales",
    subCategory: "หน้าร้าน (เงินสด)",
    amount: 5800,
    loanId: null,
    time: "14:00",
    notes: "ยอดขายเงินสดหน้าร้านช่วงกลางวัน"
  },
  {
    id: "TXN-20260913-02",
    dailyRecordId: "DR-20260913",
    type: "INCOME",
    paymentChannel: "QR_TRANSFER",
    category: "sales",
    subCategory: "โอนเงิน / พร้อมเพย์",
    amount: 2450,
    loanId: null,
    time: "14:15",
    notes: "ลูกค้าสแกนจ่าย QR"
  },
  {
    id: "TXN-20260913-03",
    dailyRecordId: "DR-20260913",
    type: "INCOME",
    paymentChannel: "DELIVERY",
    category: "sales",
    subCategory: "เดลิเวอรี่",
    amount: 650,
    loanId: null,
    time: "13:30",
    notes: "ออเดอร์โทรสั่งส่งบ้าน"
  },
  // รายจ่ายวัตถุดิบ (Food Cost)
  {
    id: "TXN-20260913-04",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "food_cost",
    subCategory: "เนื้อ/หมู/ไก่",
    amount: 1450,
    loanId: null,
    time: "07:30",
    notes: "ตลาดสดเช้า: สันคอหมู, ไก่สด, เลือดหมู"
  },
  {
    id: "TXN-20260913-05",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "food_cost",
    subCategory: "ผัก/ของสด",
    amount: 520,
    loanId: null,
    time: "07:45",
    notes: "มะละกอ, มะนาว, ถั่วฝักยาว, ผักสด"
  },
  {
    id: "TXN-20260913-06",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "food_cost",
    subCategory: "ของแห้ง/เครื่องปรุง",
    amount: 380,
    loanId: null,
    time: "08:15",
    notes: "น้ำปลา, ปลาร้า, น้ำตาลปี๊บ, พริกแห้ง"
  },
  {
    id: "TXN-20260913-07",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "food_cost",
    subCategory: "น้ำแข็ง",
    amount: 120,
    loanId: null,
    time: "09:00",
    notes: "น้ำแข็งบด 2 กระสอบ"
  },
  // รายจ่ายดำเนินงาน (Operating & Labor)
  {
    id: "TXN-20260913-08",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "operating",
    subCategory: "แก๊ส/ถ่าน",
    amount: 450,
    loanId: null,
    time: "10:00",
    notes: "เปลี่ยนถังแก๊ส 15 กก."
  },
  {
    id: "TXN-20260913-09",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "labor",
    subCategory: "ค่าแรงพนักงาน",
    amount: 800,
    loanId: null,
    time: "14:00",
    notes: "จ่ายค่าจ้างรายวันพนักงานหน้าร้าน 2 คน"
  },
  // ชำระหนี้เงินกู้รายวัน (Loan Payment)
  {
    id: "TXN-20260913-10",
    dailyRecordId: "DR-20260913",
    type: "EXPENSE",
    paymentChannel: "CASH",
    category: "loan_payment",
    subCategory: "ส่งเงินกู้รายวัน",
    amount: 600,
    loanId: "L1",
    time: "11:00",
    notes: "ส่งค่างวดสัญญา L1 (งวดที่ 15/60)"
  }
];

// App State
const storedSettings = JSON.parse(localStorage.getItem("pos_settings"));
const storedCategories = JSON.parse(localStorage.getItem("pos_categories"));
const storedMenus = JSON.parse(localStorage.getItem("pos_menus"));
const storedTables = JSON.parse(localStorage.getItem("pos_tables"));
const storedLoans = JSON.parse(localStorage.getItem("pos_loans"));
const storedDailyRecords = JSON.parse(localStorage.getItem("pos_daily_records"));
const storedTransactions = JSON.parse(localStorage.getItem("pos_transactions"));

window.posState = {
  settings: (storedSettings && storedSettings.shopName) ? { ...DEFAULT_SHOP_SETTINGS, ...storedSettings } : DEFAULT_SHOP_SETTINGS,
  categories: (storedCategories && storedCategories.length > 0) ? storedCategories : DEFAULT_CATEGORIES,
  menus: (storedMenus && storedMenus.length > 0) ? storedMenus : DEFAULT_MENUS,
  tables: (storedTables && storedTables.length > 0) ? storedTables : DEFAULT_TABLES,
  orders: JSON.parse(localStorage.getItem("pos_orders")) || [],
  loans: (storedLoans && storedLoans.length > 0) ? storedLoans : DEFAULT_LOANS,
  dailyRecords: (storedDailyRecords && storedDailyRecords.length > 0) ? storedDailyRecords : DEFAULT_DAILY_RECORDS,
  transactions: (storedTransactions && storedTransactions.length > 0) ? storedTransactions : DEFAULT_TRANSACTIONS
};

// Enforce clean tables (no VIP, no zone, no seats)
if (Array.isArray(window.posState.tables)) {
  window.posState.tables = window.posState.tables
    .filter(t => t.id !== "t-vip" && !String(t.name || "").includes("VIP"))
    .map(t => ({
      id: t.id,
      name: t.name,
      status: t.status || "available"
    }));
  localStorage.setItem("pos_tables", JSON.stringify(window.posState.tables));
}

// Enforce latest drinks if still pointing to old 24 items
if (window.posState.menus.length < 30 || !window.posState.menus.some(m => m.name.includes("เบียร์สิงห์"))) {
  window.posState.menus = DEFAULT_MENUS;
  window.posState.categories = DEFAULT_CATEGORIES;
  localStorage.setItem("pos_menus", JSON.stringify(DEFAULT_MENUS));
  localStorage.setItem("pos_categories", JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem("pos_menu_version", MENU_SCHEMA_VERSION);
}

// Sync state helper
function savePOSState() {
  localStorage.setItem("pos_settings", JSON.stringify(window.posState.settings));
  localStorage.setItem("pos_categories", JSON.stringify(window.posState.categories));
  localStorage.setItem("pos_menus", JSON.stringify(window.posState.menus));
  localStorage.setItem("pos_tables", JSON.stringify(window.posState.tables));
  localStorage.setItem("pos_orders", JSON.stringify(window.posState.orders));
  localStorage.setItem("pos_loans", JSON.stringify(window.posState.loans));
  localStorage.setItem("pos_daily_records", JSON.stringify(window.posState.dailyRecords));
  localStorage.setItem("pos_transactions", JSON.stringify(window.posState.transactions));
}

// Refresh Lucide icons
function refreshLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Live Clock Helper
function startLiveClock(elementId = "liveClock") {
  const clockEl = document.getElementById(elementId);
  if (!clockEl) return;
  function updateTime() {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  updateTime();
  setInterval(updateTime, 1000);
}


// Self-Healing Auto Recovery: If stored menus or tables are empty, restore fresh standard data immediately
if (!window.posState.menus || window.posState.menus.length === 0) {
  window.posState.menus = DEFAULT_MENUS.length > 0 ? DEFAULT_MENUS : FALLBACK_MENUS;
  localStorage.setItem("pos_menus", JSON.stringify(window.posState.menus));
}
if (!window.posState.tables || window.posState.tables.length === 0) {
  window.posState.tables = DEFAULT_TABLES.length > 0 ? DEFAULT_TABLES : FALLBACK_TABLES;
  localStorage.setItem("pos_tables", JSON.stringify(window.posState.tables));
}
if (!window.posState.categories || window.posState.categories.length === 0) {
  window.posState.categories = DEFAULT_CATEGORIES.length > 0 ? DEFAULT_CATEGORIES : FALLBACK_CATEGORIES;
  localStorage.setItem("pos_categories", JSON.stringify(window.posState.categories));
}


// ============================================================================
// ⚡ Auto-Reset Engine: Guarantees 43 Menus and Tables are always restored
// ============================================================================
(function autoResetCheck() {
  if (typeof window === 'undefined') return;
  try {
    const rawMenus = localStorage.getItem("pos_menus");
    const rawTables = localStorage.getItem("pos_tables");
    const rawCategories = localStorage.getItem("pos_categories");
    
    const parsedMenus = rawMenus ? JSON.parse(rawMenus) : null;
    const parsedTables = rawTables ? JSON.parse(rawTables) : null;
    const parsedCats = rawCategories ? JSON.parse(rawCategories) : null;

    const needsReset = !parsedMenus || parsedMenus.length < 30 || !parsedTables || parsedTables.length === 0 || !parsedCats || parsedCats.length === 0;

    if (needsReset) {
      console.log("⚡ [Auto-Reset] Stale or empty data detected. Restoring 43 standard menus and tables...");
      const menusToSave = (typeof DEFAULT_MENUS !== 'undefined' && DEFAULT_MENUS.length > 0) ? DEFAULT_MENUS : FALLBACK_MENUS;
      const catsToSave = (typeof DEFAULT_CATEGORIES !== 'undefined' && DEFAULT_CATEGORIES.length > 0) ? DEFAULT_CATEGORIES : FALLBACK_CATEGORIES;
      const tablesToSave = (typeof DEFAULT_TABLES !== 'undefined' && DEFAULT_TABLES.length > 0) ? DEFAULT_TABLES : FALLBACK_TABLES;

      localStorage.setItem("pos_menus", JSON.stringify(menusToSave));
      localStorage.setItem("pos_categories", JSON.stringify(catsToSave));
      localStorage.setItem("pos_tables", JSON.stringify(tablesToSave));
      localStorage.setItem("pos_menu_version", "krua_lung_nui_v6_modular_supabase");

      if (window.posState) {
        window.posState.menus = menusToSave;
        window.posState.categories = catsToSave;
        window.posState.tables = tablesToSave;
      }
    }
  } catch(e) {
    console.warn("Auto-Reset warning:", e);
  }
})();
