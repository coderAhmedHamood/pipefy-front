-- إنشاء جدول إعدادات النظام (صف واحد فقط)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- معلومات النظام الأساسية
    system_name VARCHAR(255) NOT NULL DEFAULT 'نظام إدارة المهام',
    system_description TEXT DEFAULT 'نظام شامل لإدارة المهام والعمليات التجارية',
    system_logo_url TEXT,
    system_favicon_url TEXT,
    system_primary_color VARCHAR(20) DEFAULT '#1F2937',
    system_secondary_color VARCHAR(20) DEFAULT '#3B82F6',
    system_language VARCHAR(10) DEFAULT 'ar',
    system_timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
    system_date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    system_time_format VARCHAR(5) DEFAULT '24h',
    system_theme VARCHAR(50) DEFAULT 'light',
    
    -- إعدادات الإشعارات
    notifications_enabled BOOLEAN DEFAULT TRUE,
    notifications_email_enabled BOOLEAN DEFAULT TRUE,
    notifications_browser_enabled BOOLEAN DEFAULT TRUE,
    
    -- إعدادات الأمان
    security_session_timeout INTEGER DEFAULT 60,
    security_password_min_length INTEGER DEFAULT 8,
    security_login_attempts_limit INTEGER DEFAULT 5,
    security_lockout_duration INTEGER DEFAULT 30,
    
    -- إعدادات البريد الإلكتروني / التكاملات
    integrations_email_smtp_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
    integrations_email_smtp_port INTEGER DEFAULT 587,
    integrations_email_smtp_username VARCHAR(255),
    integrations_email_smtp_password TEXT,
    integrations_email_from_address VARCHAR(255) DEFAULT 'system@company.com',
    integrations_email_from_name VARCHAR(255) DEFAULT 'نظام إدارة المهام',
    integrations_email_enabled BOOLEAN DEFAULT FALSE,
    integrations_email_send_delayed_tickets BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_assignment BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_comment BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_completion BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_creation BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_update BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_move BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_review_assigned BOOLEAN DEFAULT FALSE,
    integrations_email_send_on_review_updated BOOLEAN DEFAULT FALSE,
    
    -- إعدادات النسخ الاحتياطي
    backup_enabled BOOLEAN DEFAULT FALSE,
    backup_frequency VARCHAR(20) DEFAULT 'daily',
    backup_retention_days INTEGER DEFAULT 30,
    
    -- إعدادات ساعات العمل
    working_hours_enabled BOOLEAN DEFAULT FALSE,
    
    -- إعدادات الصيانة
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT DEFAULT 'النظام قيد الصيانة، يرجى المحاولة لاحقاً',
    
    -- إعدادات الملفات
    max_file_upload_size INTEGER DEFAULT 10485760,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','gif'],
    
    -- إعدادات التذاكر
    default_ticket_priority VARCHAR(20) DEFAULT 'medium',
    auto_assign_tickets BOOLEAN DEFAULT FALSE,
    ticket_numbering_format VARCHAR(100) DEFAULT 'TKT-{YYYY}-{MM}-{####}',
    
    -- روابط النظام
    frontend_url TEXT DEFAULT 'http://localhost:8080',
    api_base_url TEXT DEFAULT 'http://localhost:3004',
    
    -- تتبع الإنشاء والتعديل
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- التأكد من وجود صف افتراضي واحد فقط
INSERT INTO settings (system_name, system_description)
SELECT 'نظام إدارة المهام', 'نظام شامل لإدارة المهام والعمليات التجارية'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- إنشاء دالة وقيد لضمان وجود صف واحد فقط
CREATE OR REPLACE FUNCTION check_single_settings_row()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM settings) >= 1 AND TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'يمكن وجود صف واحد فقط في جدول الإعدادات. استخدم UPDATE بدلاً من INSERT.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
