-- ============================================================================
-- SQL Schema for ครัวลุงหนุ่ย (Krua Lung Nui) - Zero Cost Restaurant POS
-- Compatible with Supabase / PostgreSQL Free Tier
-- ============================================================================

-- 1. Shop Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL DEFAULT 'ครัวลุงหนุ่ย (Krua Lung Nui)',
    phone VARCHAR(50),
    address TEXT,
    receipt_footer TEXT,
    promptpay_type VARCHAR(20) DEFAULT 'mobile',
    promptpay_id VARCHAR(50) NOT NULL,
    promptpay_name VARCHAR(150) NOT NULL,
    line_webhook_url TEXT,
    service_charge NUMERIC(5,2) DEFAULT 0,
    vat NUMERIC(5,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menus Table
CREATE TABLE IF NOT EXISTS menus (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    options TEXT, -- comma-separated or JSON list
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tables Table
CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    zone VARCHAR(100) DEFAULT 'ทั่วไป',
    seats INT DEFAULT 4,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'billing'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    table_id VARCHAR(50) REFERENCES tables(id) ON DELETE CASCADE,
    table_name VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'cooking', 'served', 'completed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid'
    payment_method VARCHAR(50) DEFAULT 'promptpay',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime publication for Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE menus;
