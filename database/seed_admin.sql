-- =====================================================
-- إنشاء المستخدم الافتراضي (Admin User) - PostgreSQL Version
-- =====================================================

-- التأكد من عدم وجود المستخدم مسبقاً لتجنب الأخطاء
DELETE FROM users WHERE username = 'admin';

-- إنشاء المستخدم المدير
INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_at
) VALUES (
    'admin',
    'admin@princessgold.com',
    -- هذا الهاش هو لكلمة المرور: 123456
    -- يمكنك تغييرها لاحقاً من داخل لوحة التحكم
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'مدير النظام',
    'admin',
    true, -- في PostgreSQL يجب استخدام true بدلاً من 1
    CURRENT_TIMESTAMP
);