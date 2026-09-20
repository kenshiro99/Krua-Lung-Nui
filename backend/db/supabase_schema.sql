-- ============================================================================
-- ครัวลุงหนุ่ย (Krua Lung Nui) - Full Supabase PostgreSQL Schema & Seed Data
-- Project ID: myajcbynabcwfmlvqpwv
-- URL: https://myajcbynabcwfmlvqpwv.supabase.co
-- Idempotent Version: สามารถกด Run ซ้ำกี่ครั้งก็ได้โดยไม่มี Error Duplicate
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Shop Settings Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_settings (
    id SERIAL PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL DEFAULT 'ครัวลุงหนุ่ย (Krua Lung Nui)',
    phone VARCHAR(50) DEFAULT '089-123-4567',
    address TEXT DEFAULT 'ร้านครัวลุงหนุ่ย อร่อยเหมือนกินที่บ้าน ซ.คุ้มเกล้า 20',
    receipt_footer TEXT DEFAULT 'อร่อยเหมือนกินที่บ้าน • ขอบคุณที่อุดหนุนครัวลุงหนุ่ยครับ 🙏',
    promptpay_type VARCHAR(20) DEFAULT 'mobile',
    promptpay_id VARCHAR(50) NOT NULL DEFAULT '0891234567',
    promptpay_name VARCHAR(150) NOT NULL DEFAULT 'ครัวลุงหนุ่ย (Krua Lung Nui)',
    line_webhook_url TEXT,
    service_charge NUMERIC(5,2) DEFAULT 0,
    vat NUMERIC(5,2) DEFAULT 0,
    initial_cash NUMERIC(12,2) DEFAULT 2000,
    target_daily_sales NUMERIC(12,2) DEFAULT 8000,
    target_food_cost_pct NUMERIC(5,2) DEFAULT 35,
    target_labor_cost_pct NUMERIC(5,2) DEFAULT 18,
    target_net_margin_pct NUMERIC(5,2) DEFAULT 15,
    working_days_per_month INT DEFAULT 26,
    monthly_fixed_costs NUMERIC(12,2) DEFAULT 18000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Categories Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Menus Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menus (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost NUMERIC(10,2) DEFAULT 0,
    image_url TEXT,
    options TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Tables Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    zone VARCHAR(100) DEFAULT 'ทั่วไป',
    seats INT DEFAULT 4,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'billing'
    current_order_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Orders Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    table_id VARCHAR(50) REFERENCES tables(id) ON DELETE SET NULL,
    table_name VARCHAR(50) NOT NULL,
    order_type VARCHAR(50) DEFAULT 'dine-in', -- 'dine-in', 'takeaway'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'cooking', 'served', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid'
    payment_method VARCHAR(50) DEFAULT 'promptpay', -- 'cash', 'promptpay'
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    customer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. Accounting Ledger Table (Dual-View: Cash Basis & Accrual)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id VARCHAR(100) PRIMARY KEY,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_time TIME DEFAULT CURRENT_TIME,
    type VARCHAR(20) NOT NULL, -- 'INCOME', 'EXPENSE'
    channel VARCHAR(30) NOT NULL DEFAULT 'CASH', -- 'CASH', 'QR_TRANSFER', 'DELIVERY'
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    cash_date DATE,
    accrual_date DATE,
    ref_loan_id VARCHAR(100),
    ref_order_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. Loan Contracts Table (ระบบติดตามเงินกู้/หนี้สิน)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_contracts (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    principal NUMERIC(12,2) NOT NULL DEFAULT 0,
    remaining_principal NUMERIC(12,2) NOT NULL DEFAULT 0,
    interest_rate_pct NUMERIC(5,2) DEFAULT 0,
    term_months INT DEFAULT 12,
    paid_installments INT DEFAULT 0,
    monthly_payment NUMERIC(12,2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAID_OFF'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. Safe Realtime Publication Registration (ป้องกัน Error 42710)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- 1. สร้าง Publication หากยังไม่มี
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- 2. เพิ่มตาราง orders อย่างปลอดภัย
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  -- 3. เพิ่มตาราง tables อย่างปลอดภัย
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  END IF;

  -- 4. เพิ่มตาราง menus อย่างปลอดภัย
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menus'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menus;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN OTHERS THEN
    NULL;
END $$;

-- ----------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Policies (ป้องกัน Policy Duplicate Error)
-- ----------------------------------------------------------------------------
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_contracts ENABLE ROW LEVEL SECURITY;

-- 1. shop_settings policies
DROP POLICY IF EXISTS "Public can view settings" ON shop_settings;
CREATE POLICY "Public can view settings" ON shop_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all operations on settings" ON shop_settings;
CREATE POLICY "Allow all operations on settings" ON shop_settings FOR ALL USING (true);

-- 2. categories policies
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);

-- 3. menus policies
DROP POLICY IF EXISTS "Public can view menus" ON menus;
CREATE POLICY "Public can view menus" ON menus FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all operations on menus" ON menus;
CREATE POLICY "Allow all operations on menus" ON menus FOR ALL USING (true);

-- 4. tables policies
DROP POLICY IF EXISTS "Public can view tables" ON tables;
CREATE POLICY "Public can view tables" ON tables FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all operations on tables" ON tables;
CREATE POLICY "Allow all operations on tables" ON tables FOR ALL USING (true);

-- 5. orders policies
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can view orders" ON orders;
CREATE POLICY "Public can view orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);

-- 6. ledger & loan policies
DROP POLICY IF EXISTS "Allow all operations on ledger" ON ledger_transactions;
CREATE POLICY "Allow all operations on ledger" ON ledger_transactions FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow all operations on loans" ON loan_contracts;
CREATE POLICY "Allow all operations on loans" ON loan_contracts FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 10. Seed Initial Data (Upsert)
-- ----------------------------------------------------------------------------

-- Seed Settings
INSERT INTO shop_settings (id, shop_name, phone, promptpay_id, promptpay_name)
VALUES (1, 'ครัวลุงหนุ่ย (Krua Lung Nui)', '089-123-4567', '0891234567', 'ครัวลุงหนุ่ย (Krua Lung Nui)')
ON CONFLICT (id) DO UPDATE SET shop_name = EXCLUDED.shop_name;

-- Seed Categories
INSERT INTO categories (id, name, sort_order) VALUES ('cat-all', 'ทั้งหมด', 1) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-recommend', '🌟 รายการแนะนำ', 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-alacarte', '🍳 อาหารตามสั่ง', 3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-isan', '🌶️ อาหารอีสาน ส้มตำ ลาบ ก้อย', 4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-soup-yum', '🍲 อาหารประเภทต้ม ยำ', 5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-drink-promo', '🔥 โปรต้อนรับร้านใหม่ (16.00-21.00)', 6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-alcohol', '🍾 เหล้า & เบียร์', 7) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
INSERT INTO categories (id, name, sort_order) VALUES ('cat-mixer', '🧊 น้ำดื่ม & ของผสม', 8) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

-- Seed Menus (43 items)
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-rec-1', 'cat-recommend', 'ต้มเลือดหมู', 'น้ำซุปหอมหวานกระดูกหมู เลือดหมูนุ่ม หมูสับก้อน หมูชิ้น ตำลึงสด โรยกระเทียมเจียวหอมกรุ่น', 50, 'images/tom_luead_moo.jpg', 'ใส่ทุกอย่าง, ไม่ใส่เครื่องใน, เพิ่มข้าวสวย (+10), พิเศษ (+10)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-rec-2', 'cat-recommend', 'ข้าวมันไก่', 'ข้าวมันหอมนุ่มเม็ดสวย ไก่ตอนเนื้อฉ่ำนุ่ม น้ำจิ้มเต้าเจี้ยวขิงสูตรเด็ด เสิร์ฟคู่น้ำซุปร้อนๆ', 50, 'images/khao_man_gai.jpg', 'เนื้ออก, เนื้อสะโพก, เนื้อน่อง, พิเศษ (+10)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-rec-3', 'cat-recommend', 'ก๋วยเตี๋ยวหมู', 'ก๋วยเตี๋ยวหมูน้ำใสกลมกล่อม หมูแดง หมูสับ ลูกชิ้นหมู เกี๊ยวกรอบ โรยถั่วลิสงคั่วหอม', 50, 'images/kuay_tiew_moo.jpg', 'เส้นเล็ก, เส้นใหญ่, เส้นหมี่ขาว, บะหมี่เหลือง, พิเศษ (+10)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ala-1', 'cat-alacarte', 'กระเพราหมู', 'หมูสับ/หมูชิ้นผัดกะเพรารสเด็ดคั่วแห้งพริกกระเทียม ใบกะเพราหอมกรุ่น ราดข้าวสวยร้อนๆ', 50, 'images/krapow_moo.jpg', 'หมูสับ, หมูชิ้น, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ala-2', 'cat-alacarte', 'กระเพราไก่', 'เนื้อไก่นุ่มผัดพริกกระเทียมใบกะเพราป่ารสชาติเข้มข้นจัดจ้าน อร่อยเด็ดถึงใจ', 50, 'images/krapow_gai.jpg', 'เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+10)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ala-3', 'cat-alacarte', 'กระเพราทะเล', 'กุ้งสดตัวโต ปลาหมึกกรอบเนื้อเด้ง ผัดกะเพราพริกสดรสจัดจ้าน จัดเต็มซีฟู้ดสดใหม่', 60, 'images/krapow_talay.jpg', 'เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ala-4', 'cat-alacarte', 'กระเพรารวม', 'กะเพราเครื่องแน่นรวมมิตร หมู ไก่ กุ้ง หมึก ผัดคลุกเคล้าพริกแห้งและใบกะเพราหอมฟุ้ง', 60, 'images/krapow_ruam.jpg', 'เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก, เพิ่มไข่ดาว (+10), พิเศษ (+20)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-1', 'cat-isan', 'แกงอ่อมหมู', 'แกงอ่อมสไตล์อีสานแท้ ผักชีลาวหอมๆ มะเขือเปราะ ฟักทอง หมูนุ่ม ซดน้ำซุปหอมข้าวคั่ว', 80, 'images/gaeng_om_moo.jpg', 'เผ็ดน้อย, เผ็ดปกติ, เผ็ดแซ่บ, เพิ่มผักชีลาว', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-2', 'cat-isan', 'ลาบเนื้อ ก้อยขม', 'เนื้อวัวสดคลุกเคล้าพริกป่นคั่วเอง ข้าวคั่วหอม ดีวัวรสขมกำลังดี หอมสะระแหน่และผักไผ่', 90, 'images/larb_neua_koi_khom.jpg', 'ลาบสุก, ลาบดิบ, ก้อยขม (ใส่ดี), ไม่ขม', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-3', 'cat-isan', 'ต้มแซ่บ', 'ต้มแซ่บกระดูกหมูอ่อน/เนื้อเปื่อย น้ำซุปรสเปรี้ยวเผ็ดจี๊ดจ๊าด หอมสมุนไพรข่าตะไคร้ใบมะกรูด', 80, 'images/tom_saap.jpg', 'หมูอ่อน, เนื้อเปื่อย, เผ็ดน้อย, เผ็ดจัดจ้าน', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-4', 'cat-isan', 'คอหมูย่าง', 'สันคอหมูหมักสูตรพิเศษย่างเตาถ่านหอมกรุ่น เนื้อนุ่มฉ่ำ เสิร์ฟพร้อมน้ำจิ้มแจ่วข้าวคั่วพริกป่น', 80, 'images/kor_moo_yang.jpg', 'ติดมัน, มันน้อย, เพิ่มน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-5', 'cat-isan', 'ไส้ตัวลวก', 'ไส้อ่อนหมูสดลวกสุกสะอาดนุ่มเด้ง ไม่เหนียว ไม่คาว โรยกระเทียมเจียว เสิร์ฟคู่น้ำจิ้มซีฟู้ดแจ่วแซ่บ', 100, 'images/sai_tua_luak.jpg', 'น้ำจิ้มซีฟู้ด, น้ำจิ้มแจ่ว, รับทั้ง 2 น้ำจิ้ม', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-6', 'cat-isan', 'ลาบทะเล', 'กุ้งสดและปลาหมึกลวกสุกเด้ง คลุกเคล้าเครื่องลาบอีสาน ข้าวคั่ว มะนาวแท้ พริกป่นหอมจัดจ้าน', 120, 'images/larb_talay.jpg', 'เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-7', 'cat-isan', 'ตำปลาร้า', 'ส้มตำปลาร้าสูตรลุงหนุ่ย น้ำปลาร้าต้มสุกหอมนัว มะละกอกรอบ พริกแห้งพริกสดแซ่บสะใจ', 50, 'images/somtum_plara.jpg', 'พริก 2 เม็ด (เผ็ดน้อย), พริก 5 เม็ด (เผ็ดปกติ), พริก 10 เม็ด (เผ็ดมาก), ไม่ใส่ชูรส', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-8', 'cat-isan', 'ตำทะเล', 'ตำส้มตำเครื่องซีฟู้ด กุ้งสด หมึกสด หอยแมลงภู่ คลุกเคล้าน้ำปลาร้า/ไทย รสเด็ดจัดจ้าน', 100, 'images/somtum_talay.jpg', 'ตำปลาร้า, ตำไทย, เผ็ดน้อย, เผ็ดแซ่บจี๊ด', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-9', 'cat-isan', 'ตำกุ้งสด', 'ส้มตำรสเด็ดใส่กุ้งสดเนื้อหวานเด้ง ปลาร้านัวลึก พริกสด มะนาวแท้ แซ่บถึงเครื่อง', 70, 'images/somtum_goong_sod.jpg', 'กุ้งสดดิบ, กุ้งลวกสุก, เผ็ดน้อย, เผ็ดปกติ, เผ็ดพ่นไฟ', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-10', 'cat-isan', 'ตำแตง ตำถั่ว', 'ตำแตงกวากรอบฉ่ำน้ำ หรือตำถั่วฝักยาวเคี้ยวกรุบกรอบ นัวน้ำปลาร้าสูตรเด็ดลุงหนุ่ย', 60, 'images/somtum_taeng_thua.jpg', 'ตำแตง, ตำถั่วฝักยาว, ตำแตง+ถั่วรวม, เผ็ดปกติ, เผ็ดมาก', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-11', 'cat-isan', 'ลาบหมู', 'หมูสับล้วนปรุงรสลาบอีสานแท้ ข้าวคั่วคั่วใหม่ มะนาวสด หอมแดง สะระแหน่ ต้นหอมผักชี', 80, 'images/larb_moo.jpg', 'ใส่ตับหมู, ไม่ใส่ตับ, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-12', 'cat-isan', 'ตับหวาน', 'ตับหมูสดลวกสุกกำลังนุ่มฉ่ำ ไม่แข็ง คลุกเครื่องลาบรสเปรี้ยวเค็มเผ็ดหอมข้าวคั่ว', 80, 'images/tub_whan.jpg', 'ตับสุกนุ่ม, ตับสุกพอดี, เผ็ดน้อย, เผ็ดปกติ', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-13', 'cat-isan', 'น้ำตกหมู', 'เนื้อหมูย่างเตาถ่านหั่นชิ้นพอดีคำ คลุกเคล้าน้ำตกสมุนไพร ข้าวคั่วหอม พริกป่น น้ำปลา มะนาวสด', 80, 'images/nam_tok_moo.jpg', 'หมูติดมัน, เนื้อล้วน, เผ็ดปกติ, เผ็ดมาก', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-14', 'cat-isan', 'เสือร้องไห้', 'เนื้อวัวส่วนอกติดมันหมักซอสย่างเตาถ่านหอมกรุ่น นุ่มหนึบเคี้ยวเพลิน เสิร์ฟคู่น้ำจิ้มแจ่วรสเด็ด', 80, 'images/suea_rong_hai.jpg', 'ติดมัน, มันน้อย, สุกปานกลาง (Medium), สุกทั่ว (Well done)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-isa-15', 'cat-isan', 'หมูแดดเดียวทอด', 'เนื้อหมูหมักเครื่องเทศตากแดดจนได้ที่ ทอดร้อนๆ เนื้อนุ่มฉ่ำ รสกลมกล่อม ทานคู่ข้าวเหนียวเด็ดมาก', 80, 'images/moo_daed_deaw.jpg', 'พร้อมซอสพริก, พร้อมน้ำจิ้มแจ่ว, เพิ่มข้าวเหนียว (+15)', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ty-1', 'cat-soup-yum', 'ต้มยำรวมมิตร', 'ต้มยำเครื่องแน่น หมู ไก่ กุ้ง หมึก เห็ดฟาง น้ำซุปต้มยำครบรส เปรี้ยว เค็ม เผ็ด หอมพริกเผา', 120, 'images/tomyum_ruammit.jpg', 'น้ำข้น, น้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดจัดจ้าน', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ty-2', 'cat-soup-yum', 'ต้มยำทะเล ข้น/ใส', 'ต้มยำซีฟู้ด กุ้งแม่น้ำ ปลาหมึกสด หอยแมลงภู่ สมุนไพรไทย ข่า ตะไคร้ ใบมะกรูด มะนาวแท้', 100, 'images/tomyum_talay.jpg', 'ต้มยำน้ำข้น, ต้มยำน้ำใส, เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ty-3', 'cat-soup-yum', 'ยำวุ้นเส้น', 'วุ้นเส้นเหนียวนุ่ม ยำใส่หมูสับ กุ้งสด หมึกสด ถั่วลิสงคั่ว น้ำยำรสเปรี้ยวแซ่บจี๊ดจ๊าด', 80, 'images/yum_woon_sen.jpg', 'ยำวุ้นเส้นรวมมิตร, ยำวุ้นเส้นหมูสับล้วน, เผ็ดน้อย, เผ็ดแซ่บ', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ty-4', 'cat-soup-yum', 'ยำทะเล', 'ยำซีฟู้ดรวม กุ้งเด้ง ปลาหมึกสดกรอบ หอยแมลงภู่ คลุกน้ำยำรสเด็ดจี๊ดจ๊าด ใส่ขึ้นฉ่ายหอมแดง', 100, 'images/yum_talay.jpg', 'เผ็ดน้อย, เผ็ดปกติ, เผ็ดมาก', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ty-5', 'cat-soup-yum', 'กุ้งแช่น้ำปลา', 'กุ้งสดเนื้อหวานคัดพิเศษ แช่น้ำปลาดี เสิร์ฟพร้อมกระเทียมสด มะระสด และน้ำจิ้มซีฟู้ดมะนาวพริกขี้หนูสวน', 100, 'images/goong_chae_nampla.jpg', 'น้ำจิ้มซีฟู้ดราดเลย, แยกน้ำจิ้ม, เพิ่มกระเทียมมะระ', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-ty-6', 'cat-soup-yum', 'เฟรนช์ฟรายส์', 'มันฝรั่งแท่งทอดกรอบสีทอง กรอบนอกนุ่มใน ไม่อมน้ำมัน โรยเกลือเล็กน้อย เสิร์ฟพร้อมซอสมะเขือเทศและมายองเนส', 50, 'images/french_fries.jpg', 'ซอสมะเขือเทศ, ซอสพริก, มายองเนส, รับทุกซอส', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-pr-1', 'cat-drink-promo', 'โปรเบียร์ลีโอ 3 ขวด 230.- (ปกติ 240.-)', 'สุดคุ้มชุดประหยัด เบียร์ลีโอ 3 ขวดใหญ่ แช่เย็นพร้อมเสิร์ฟ', 230, 'images/promo_beer_leo_3.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-pr-2', 'cat-drink-promo', 'โปรเบียร์ช้าง 3 ขวด 230.- (ปกติ 240.-)', 'โปรโมชั่นสุดคุ้ม เบียร์ช้างคลาสสิก 3 ขวดใหญ่ เย็นสะใจ', 230, 'images/promo_beer_chang_3.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-pr-3', 'cat-drink-promo', 'โปรเบียร์สิงห์ 3 ขวด 260.- (ปกติ 270.-)', 'โปรโมชั่นสิงห์ 3 ขวดใหญ่ รสชาติเข้มข้น ดื่มด่ำทุกช่วงเวลา', 260, 'images/promo_beer_singha_3.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-dp-1', 'cat-drink-promo', 'โปรเบียร์สิงห์ 2 ขวด (โปรต้อนรับร้านใหม่)', 'เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)', 99, 'images/promo_beer_singha.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-dp-2', 'cat-drink-promo', 'เบียร์ช้าง หรือ ลีโอ 2 ขวด (โปรต้อนรับร้านใหม่)', 'เสิร์ฟช่วง 16.00–21.00 น. *ทุกเซตแถมฟรีเฟรนช์ฟรายส์ 1 จาน (เฉพาะการสั่งชุดแรก และจำกัดโต๊ะละ 1 ชุด)', 89, 'images/promo_beer_chang_leo.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-dp-3', 'cat-drink-promo', 'เบลนด์ 285 ขวดลิตร (โปรต้อนรับร้านใหม่)', 'แถมฟรีโซดา 4 ขวด และน้ำแข็ง 1 ถัง + แถมฟรีเฟรนช์ฟรายส์ 1 จาน (เสิร์ฟช่วง 16.00–21.00 น. จำกัดโต๊ะละ 1 ชุด)', 350, 'images/promo_blend285.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-lq-1', 'cat-alcohol', 'เบลนด์ 285 (Blend 285)', 'สุราผสมกลิ่นวิสกี้ รสนุ่ม หอมกลมกล่อม ดื่มง่าย (กลม 300.- / ลิตร 400.-)', 300, 'images/liquor_blend285.jpg', 'กลม (700ml) 300.-, ลิตร (1000ml) 400.-', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-lq-2', 'cat-alcohol', 'หงส์ทอง (Hong Thong)', 'สุราปรุงพิเศษสีย้อมทอง หอมละมุน กลมกล่อม (แบน 200.- / กลม 380.-)', 200, 'images/liquor_hongthong.jpg', 'แบน (350ml) 200.-, กลม (700ml) 380.-', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-lq-3', 'cat-alcohol', 'แสงโสม (SangSom)', 'สุราพิเศษไทย หมักบ่มถังไม้โอ๊ก รสชาติเข้มข้น หอมกรุ่น (แบน 220.- / กลม 400.-)', 220, 'images/liquor_sangsom.jpg', 'แบน (350ml) 220.-, กลม (700ml) 400.-', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-br-1', 'cat-alcohol', 'เบียร์สิงห์ (Singha)', 'เบียร์สิงห์ขวดใหญ่ แช่เย็นเจี๊ยบ รสชาติเข้มข้น หอมกรุ่น (ขวดละ 90.-)', 90, 'images/beer_singha.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-br-2', 'cat-alcohol', 'เบียร์ลีโอ (Leo)', 'เบียร์ลีโอขวดใหญ่ แช่เย็น รสนุ่ม ดื่มง่าย ยอดนิยม (ขวดละ 80.-)', 80, 'images/beer_leo.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-br-3', 'cat-alcohol', 'เบียร์ช้าง (Chang)', 'เบียร์ช้างคลาสสิกขวดใหญ่ เย็นสดชื่น สะใจทุกแก้ว (ขวดละ 80.-)', 80, 'images/beer_chang.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-mx-1', 'cat-mixer', 'โซดา (Soda)', 'โซดาสิงห์ขวดแก้ว ซ่าสดชื่นยาวนาน (ขวดละ 20 บาท)', 20, 'images/mixer_soda.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-mx-2', 'cat-mixer', 'น้ำเปล่า (Water)', 'น้ำดื่มสะอาดบริสุทธิ์ แช่เย็นสดชื่น (ขวดละ 10 บาท)', 10, 'images/mixer_water.jpg', '', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;
INSERT INTO menus (id, category_id, name, description, price, image_url, options, is_available) VALUES ('m-mx-3', 'cat-mixer', 'น้ำแข็ง (Ice Bucket)', 'น้ำแข็งถังแรกของทุกโต๊ะไม่คิดเงิน (ฟรี) • ถังต่อไปคิดถังละ 20 บาท', 0, 'images/mixer_ice.jpg', 'ถังแรกประจำโต๊ะ (ฟรี), สั่งเพิ่มถังต่อไป 20.-', TRUE) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, image_url = EXCLUDED.image_url, options = EXCLUDED.options, is_available = EXCLUDED.is_available;

-- Seed Tables (6 tables)
INSERT INTO tables (id, name, zone, seats, status) VALUES ('t-1', '1', 'ทั่วไป', 4, 'available') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;
INSERT INTO tables (id, name, zone, seats, status) VALUES ('t-2', '2', 'ทั่วไป', 4, 'available') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;
INSERT INTO tables (id, name, zone, seats, status) VALUES ('t-3', '3', 'ทั่วไป', 4, 'available') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;
INSERT INTO tables (id, name, zone, seats, status) VALUES ('t-4', '4', 'ทั่วไป', 6, 'available') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;
INSERT INTO tables (id, name, zone, seats, status) VALUES ('t-5', '5', 'ทั่วไป', 6, 'available') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;
INSERT INTO tables (id, name, zone, seats, status) VALUES ('t-6', '6', 'ทั่วไป', 8, 'available') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- ----------------------------------------------------------------------------
-- 11. Supabase Storage Bucket Setup (krua-lung-nui-assets)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'krua-lung-nui-assets',
  'krua-lung-nui-assets',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET public = TRUE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Public can view krua assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to krua assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow manage krua assets" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Public can view krua assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'krua-lung-nui-assets');

CREATE POLICY "Allow upload to krua assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'krua-lung-nui-assets');

CREATE POLICY "Allow manage krua assets"
ON storage.objects FOR ALL
USING (bucket_id = 'krua-lung-nui-assets');

-- All done successfully!
