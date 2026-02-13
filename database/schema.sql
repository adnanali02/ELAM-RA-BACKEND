-- =====================================================
-- قاعدة بيانات سوق الذهب والعملات - مصنوعات الأميرة
-- Princess Gold Market Database Schema (PostgreSQL Version)
-- =====================================================

-- حذف الجداول إذا كانت موجودة (لإعادة البناء عند الحاجة)
DROP TABLE IF EXISTS failed_login_attempts CASCADE;
DROP TABLE IF EXISTS error_log CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS currency_rates CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS gold_prices CASCADE;
DROP TABLE IF EXISTS gold_types CASCADE;
DROP TABLE IF EXISTS "session" CASCADE; -- جدول الجلسات الخاص بمكتبة connect-pg-simple
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- جدول المستخدمين (Users Table)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- جدول الجلسات (Sessions Table)
-- ملاحظة: هذا الجدول مطلوب لمكتبة connect-pg-simple
-- =====================================================
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- =====================================================
-- جدول أنواع الذهب (Gold Types Table)
-- =====================================================
CREATE TABLE gold_types (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(50) NOT NULL,
    name_en VARCHAR(50),
    karat INTEGER NOT NULL CHECK (karat IN (18, 21, 22, 24)),
    purity DECIMAL(5,4) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- جدول أسعار الذهب (Gold Prices Table)
-- =====================================================
CREATE TABLE gold_prices (
    id SERIAL PRIMARY KEY,
    gold_type_id INTEGER NOT NULL,
    buy_price DECIMAL(15,2) NOT NULL,
    sell_price DECIMAL(15,2) NOT NULL,
    spread DECIMAL(15,2) NOT NULL,
    margin_buy DECIMAL(5,4) DEFAULT 0,
    margin_sell DECIMAL(5,4) DEFAULT 0,
    is_manual BOOLEAN DEFAULT false,
    updated_by INTEGER,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gold_type_id) REFERENCES gold_types(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- جدول العملات (Currencies Table)
-- =====================================================
CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name_ar VARCHAR(50) NOT NULL,
    name_en VARCHAR(50),
    symbol VARCHAR(10),
    flag_emoji VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    is_base BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- جدول أسعار العملات (Currency Rates Table)
-- =====================================================
CREATE TABLE currency_rates (
    id SERIAL PRIMARY KEY,
    currency_id INTEGER NOT NULL,
    buy_rate DECIMAL(15,6) NOT NULL,
    sell_rate DECIMAL(15,6) NOT NULL,
    spread DECIMAL(15,6) NOT NULL,
    margin_buy DECIMAL(5,4) DEFAULT 0,
    margin_sell DECIMAL(5,4) DEFAULT 0,
    is_manual BOOLEAN DEFAULT false,
    updated_by INTEGER,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- جدول إعدادات المتجر (Store Settings Table)
-- =====================================================
CREATE TABLE store_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- جدول سجل العمليات (Audit Log Table)
-- =====================================================
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- جدول سجل الأخطاء (Error Log Table)
-- =====================================================
CREATE TABLE error_log (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- جدول محاولات تسجيل الدخول الفاشلة
-- =====================================================
CREATE TABLE failed_login_attempts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempt_count INTEGER DEFAULT 1,
    first_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMP
);

-- =====================================================
-- إدراج البيانات الأولية (Seed Data)
-- =====================================================

-- أنواع الذهب
INSERT INTO gold_types (name_ar, name_en, karat, purity, display_order) VALUES
('ذهب عيار 24', 'Gold 24K', 24, 0.9999, 1),
('ذهب عيار 22', 'Gold 22K', 22, 0.9167, 2),
('ذهب عيار 21', 'Gold 21K', 21, 0.8750, 3),
('ذهب عيار 18', 'Gold 18K', 18, 0.7500, 4)
ON CONFLICT DO NOTHING;

-- العملات
INSERT INTO currencies (code, name_ar, name_en, symbol, flag_emoji, is_active, is_base, display_order) VALUES
('USD', 'دولار أمريكي', 'US Dollar', '$', '🇺🇸', true, true, 1),
('EUR', 'يورو', 'Euro', '€', '🇪🇺', true, false, 2),
('SAR', 'ريال سعودي', 'Saudi Riyal', 'ر.س', '🇸🇦', true, false, 3),
('AED', 'درهم إماراتي', 'UAE Dirham', 'د.إ', '🇦🇪', true, false, 4),
('KWD', 'دينار كويتي', 'Kuwaiti Dinar', 'د.ك', '🇰🇼', true, false, 5),
('QAR', 'ريال قطري', 'Qatari Riyal', 'ر.ق', '🇶🇦', true, false, 6),
('BHD', 'دينار بحريني', 'Bahraini Dinar', 'د.ب', '🇧🇭', true, false, 7),
('OMR', 'ريال عماني', 'Omani Riyal', 'ر.ع', '🇴🇲', true, false, 8),
('JOD', 'دينار أردني', 'Jordanian Dinar', 'د.أ', '🇯🇴', true, false, 9),
('EGP', 'جنيه مصري', 'Egyptian Pound', 'ج.م', '🇪🇬', true, false, 10)
ON CONFLICT DO NOTHING;

-- إعدادات المتجر الافتراضية
INSERT INTO store_settings (setting_key, setting_value, setting_type, description) VALUES
('store_name', 'مصنوعات الأميرة', 'string', 'اسم المتجر'),
('store_name_en', 'Princess Gold', 'string', 'اسم المتجر بالإنجليزية'),
('store_address', 'الرياض، المملكة العربية السعودية', 'string', 'عنوان المتجر'),
('store_phone', '+966 50 000 0000', 'string', 'رقم الهاتف'),
('store_whatsapp', '+966 50 000 0000', 'string', 'رقم الواتساب'),
('store_instagram', '@princess.gold', 'string', 'حساب انستغرام'),
('store_facebook', 'PrincessGold', 'string', 'حساب فيسبوك'),
('market_open_time', '08:00', 'string', 'وقت فتح السوق'),
('market_close_time', '22:00', 'string', 'وقت إغلاق السوق'),
('market_timezone', 'Asia/Riyadh', 'string', 'المنطقة الزمنية'),
('market_days', '1,2,3,4,5,6', 'string', 'أيام عمل السوق (0=الأحد)'),
('default_gold_margin_buy', '0.02', 'decimal', 'هامش الشراء الافتراضي للذهب'),
('default_gold_margin_sell', '0.02', 'decimal', 'هامش البيع الافتراضي للذهب'),
('default_currency_margin_buy', '0.015', 'decimal', 'هامش الشراء الافتراضي للعملات'),
('default_currency_margin_sell', '0.015', 'decimal', 'هامش البيع الافتراضي للعملات'),
('session_timeout', '3600', 'integer', 'مهلة الجلسة بالثواني'),
('max_login_attempts', '5', 'integer', 'الحد الأقصى لمحاولات تسجيل الدخول'),
('lockout_duration', '900', 'integer', 'مدة الحظر بالثواني')
ON CONFLICT DO NOTHING;