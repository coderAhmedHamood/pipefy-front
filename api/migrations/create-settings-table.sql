-- إنشاء جدول إعدادات النظام
-- يحتوي على صف واحد فقط لجميع إعدادات النظام

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- بيانات الشركة
    company_name VARCHAR(255) NOT NULL DEFAULT 'كلين لايف',
    company_logo TEXT NULL,
    
    -- حماية تسجيل الدخول
    login_attempts_limit INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    
    -- إعدادات البريد الإلكتروني
    smtp_server VARCHAR(255) DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255) NULL,
    smtp_password VARCHAR(255) NULL,
    
    -- تواريخ النظام
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_settings_company_name ON settings(company_name);

-- إضافة الإعدادات الافتراضية (صف واحد فقط)
INSERT INTO settings (
    company_name,
    login_attempts_limit,
    lockout_duration_minutes,
    smtp_server,
    smtp_port
) 
SELECT 
    'كلين لايف',
    5,
    30,
    'smtp.gmail.com',
    587
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- التأكد من وجود صف واحد فقط
-- إضافة قيد لضمان عدم وجود أكثر من صف واحد
CREATE OR REPLACE FUNCTION check_single_settings_row()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM settings) >= 1 AND TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'يمكن وجود صف واحد فقط في جدول الإعدادات. استخدم UPDATE بدلاً من INSERT.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لمنع إضافة أكثر من صف
DROP TRIGGER IF EXISTS trigger_single_settings_row ON settings;
CREATE TRIGGER trigger_single_settings_row
    BEFORE INSERT ON settings
    FOR EACH ROW
    EXECUTE FUNCTION check_single_settings_row();

-- عرض النتيجة
SELECT 
    'تم إنشاء جدول الإعدادات بنجاح' as message,
    COUNT(*) as settings_count 
FROM settings;
