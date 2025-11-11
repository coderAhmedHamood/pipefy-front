-- Migration: مزامنة بنية جدول settings مع الكود الحالي
-- الهدف: التأكد من وجود جميع الحقول الحديثة بأسمائها الصحيحة مع القيم الافتراضية
-- التاريخ: 2025-11-11

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- إعادة تسمية الأعمدة القديمة إلى التسميات الجديدة (إذا كانت موجودة)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'company_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'system_name'
  ) THEN
    ALTER TABLE settings RENAME COLUMN company_name TO system_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'company_logo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'system_logo_url'
  ) THEN
    ALTER TABLE settings RENAME COLUMN company_logo TO system_logo_url;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'login_attempts_limit'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'security_login_attempts_limit'
  ) THEN
    ALTER TABLE settings RENAME COLUMN login_attempts_limit TO security_login_attempts_limit;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'lockout_duration_minutes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'security_lockout_duration'
  ) THEN
    ALTER TABLE settings RENAME COLUMN lockout_duration_minutes TO security_lockout_duration;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'smtp_server'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'integrations_email_smtp_host'
  ) THEN
    ALTER TABLE settings RENAME COLUMN smtp_server TO integrations_email_smtp_host;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'smtp_port'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'integrations_email_smtp_port'
  ) THEN
    ALTER TABLE settings RENAME COLUMN smtp_port TO integrations_email_smtp_port;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'smtp_username'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'integrations_email_smtp_username'
  ) THEN
    ALTER TABLE settings RENAME COLUMN smtp_username TO integrations_email_smtp_username;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'smtp_password'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'settings' AND column_name = 'integrations_email_smtp_password'
  ) THEN
    ALTER TABLE settings RENAME COLUMN smtp_password TO integrations_email_smtp_password;
  END IF;
END;
$$;

-- إضافة الأعمدة المفقودة مع القيم الافتراضية
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS system_description TEXT,
  ADD COLUMN IF NOT EXISTS system_favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS system_primary_color VARCHAR(20) DEFAULT '#1F2937',
  ADD COLUMN IF NOT EXISTS system_secondary_color VARCHAR(20) DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS system_language VARCHAR(10) DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS system_timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  ADD COLUMN IF NOT EXISTS system_date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS system_time_format VARCHAR(5) DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS system_theme VARCHAR(50) DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notifications_email_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notifications_browser_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS security_session_timeout INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS security_password_min_length INTEGER DEFAULT 8,
  ADD COLUMN IF NOT EXISTS integrations_email_from_address VARCHAR(255) DEFAULT 'system@company.com',
  ADD COLUMN IF NOT EXISTS integrations_email_from_name VARCHAR(255) DEFAULT 'نظام إدارة المهام',
  ADD COLUMN IF NOT EXISTS integrations_email_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_delayed_tickets BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_assignment BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_comment BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_completion BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_creation BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_update BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_move BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_review_assigned BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS integrations_email_send_on_review_updated BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS backup_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS backup_frequency VARCHAR(20) DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS backup_retention_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS working_hours_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'النظام قيد الصيانة، يرجى المحاولة لاحقاً',
  ADD COLUMN IF NOT EXISTS max_file_upload_size INTEGER DEFAULT 10485760,
  ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[],
  ADD COLUMN IF NOT EXISTS default_ticket_priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS auto_assign_tickets BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ticket_numbering_format VARCHAR(100) DEFAULT 'TKT-{YYYY}-{MM}-{####}',
  ADD COLUMN IF NOT EXISTS frontend_url TEXT DEFAULT 'http://localhost:8080',
  ADD COLUMN IF NOT EXISTS api_base_url TEXT DEFAULT 'http://localhost:3003',
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- التأكد من أن allowed_file_types من نوع TEXT[] مع تحويل البيانات القديمة إذا لزم الأمر
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'settings' 
      AND column_name = 'allowed_file_types' 
      AND data_type <> 'ARRAY'
  ) THEN
    ALTER TABLE settings
    ALTER COLUMN allowed_file_types TYPE TEXT[]
    USING
      CASE 
        WHEN allowed_file_types IS NULL THEN NULL
        WHEN allowed_file_types::text LIKE '[%' THEN ARRAY(
          SELECT json_array_elements_text(allowed_file_types::json)
        )
        ELSE string_to_array(
          regexp_replace(allowed_file_types::text, '^\[|\]$', '', 'g'),
          ','
        )
      END;
  END IF;
END;
$$;

-- تعيين القيم الافتراضية للأعمدة (حتى إذا كانت موجودة سابقاً بدون Default)
ALTER TABLE settings
  ALTER COLUMN system_name SET DEFAULT 'نظام إدارة المهام',
  ALTER COLUMN system_description SET DEFAULT 'نظام شامل لإدارة المهام والعمليات التجارية',
  ALTER COLUMN system_primary_color SET DEFAULT '#1F2937',
  ALTER COLUMN system_secondary_color SET DEFAULT '#3B82F6',
  ALTER COLUMN system_language SET DEFAULT 'ar',
  ALTER COLUMN system_timezone SET DEFAULT 'Asia/Riyadh',
  ALTER COLUMN system_date_format SET DEFAULT 'DD/MM/YYYY',
  ALTER COLUMN system_time_format SET DEFAULT '24h',
  ALTER COLUMN system_theme SET DEFAULT 'light',
  ALTER COLUMN notifications_enabled SET DEFAULT TRUE,
  ALTER COLUMN notifications_email_enabled SET DEFAULT TRUE,
  ALTER COLUMN notifications_browser_enabled SET DEFAULT TRUE,
  ALTER COLUMN security_session_timeout SET DEFAULT 60,
  ALTER COLUMN security_password_min_length SET DEFAULT 8,
  ALTER COLUMN security_login_attempts_limit SET DEFAULT 5,
  ALTER COLUMN security_lockout_duration SET DEFAULT 30,
  ALTER COLUMN integrations_email_smtp_host SET DEFAULT 'smtp.gmail.com',
  ALTER COLUMN integrations_email_smtp_port SET DEFAULT 587,
  ALTER COLUMN integrations_email_from_address SET DEFAULT 'system@company.com',
  ALTER COLUMN integrations_email_from_name SET DEFAULT 'نظام إدارة المهام',
  ALTER COLUMN integrations_email_enabled SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_delayed_tickets SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_assignment SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_comment SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_completion SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_creation SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_update SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_move SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_review_assigned SET DEFAULT TRUE,
  ALTER COLUMN integrations_email_send_on_review_updated SET DEFAULT TRUE,
  ALTER COLUMN backup_enabled SET DEFAULT FALSE,
  ALTER COLUMN backup_frequency SET DEFAULT 'daily',
  ALTER COLUMN backup_retention_days SET DEFAULT 30,
  ALTER COLUMN working_hours_enabled SET DEFAULT FALSE,
  ALTER COLUMN maintenance_mode SET DEFAULT FALSE,
  ALTER COLUMN maintenance_message SET DEFAULT 'النظام قيد الصيانة، يرجى المحاولة لاحقاً',
  ALTER COLUMN max_file_upload_size SET DEFAULT 10485760,
  ALTER COLUMN allowed_file_types SET DEFAULT ARRAY['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','gif'],
  ALTER COLUMN default_ticket_priority SET DEFAULT 'medium',
  ALTER COLUMN auto_assign_tickets SET DEFAULT FALSE,
  ALTER COLUMN ticket_numbering_format SET DEFAULT 'TKT-{YYYY}-{MM}-{####}',
  ALTER COLUMN frontend_url SET DEFAULT 'http://localhost:8080',
  ALTER COLUMN api_base_url SET DEFAULT 'http://localhost:3003';

-- تحديث الصف الحالي بالقيم الافتراضية إذا كانت NULL
UPDATE settings
SET
  system_name = COALESCE(system_name, 'نظام إدارة المهام'),
  system_description = COALESCE(system_description, 'نظام شامل لإدارة المهام والعمليات التجارية'),
  system_primary_color = COALESCE(system_primary_color, '#1F2937'),
  system_secondary_color = COALESCE(system_secondary_color, '#3B82F6'),
  system_language = COALESCE(system_language, 'ar'),
  system_timezone = COALESCE(system_timezone, 'Asia/Riyadh'),
  system_date_format = COALESCE(system_date_format, 'DD/MM/YYYY'),
  system_time_format = COALESCE(system_time_format, '24h'),
  system_theme = COALESCE(system_theme, 'light'),
  notifications_enabled = COALESCE(notifications_enabled, TRUE),
  notifications_email_enabled = COALESCE(notifications_email_enabled, TRUE),
  notifications_browser_enabled = COALESCE(notifications_browser_enabled, TRUE),
  security_session_timeout = COALESCE(security_session_timeout, 60),
  security_password_min_length = COALESCE(security_password_min_length, 8),
  security_login_attempts_limit = COALESCE(security_login_attempts_limit, 5),
  security_lockout_duration = COALESCE(security_lockout_duration, 30),
  integrations_email_smtp_host = COALESCE(integrations_email_smtp_host, 'smtp.gmail.com'),
  integrations_email_smtp_port = COALESCE(integrations_email_smtp_port, 587),
  integrations_email_from_address = COALESCE(integrations_email_from_address, 'system@company.com'),
  integrations_email_from_name = COALESCE(integrations_email_from_name, 'نظام إدارة المهام'),
  integrations_email_enabled = COALESCE(integrations_email_enabled, TRUE),
  integrations_email_send_delayed_tickets = COALESCE(integrations_email_send_delayed_tickets, TRUE),
  integrations_email_send_on_assignment = COALESCE(integrations_email_send_on_assignment, TRUE),
  integrations_email_send_on_comment = COALESCE(integrations_email_send_on_comment, TRUE),
  integrations_email_send_on_completion = COALESCE(integrations_email_send_on_completion, TRUE),
  integrations_email_send_on_creation = COALESCE(integrations_email_send_on_creation, TRUE),
  integrations_email_send_on_update = COALESCE(integrations_email_send_on_update, TRUE),
  integrations_email_send_on_move = COALESCE(integrations_email_send_on_move, TRUE),
  integrations_email_send_on_review_assigned = COALESCE(integrations_email_send_on_review_assigned, TRUE),
  integrations_email_send_on_review_updated = COALESCE(integrations_email_send_on_review_updated, TRUE),
  backup_enabled = COALESCE(backup_enabled, FALSE),
  backup_frequency = COALESCE(backup_frequency, 'daily'),
  backup_retention_days = COALESCE(backup_retention_days, 30),
  working_hours_enabled = COALESCE(working_hours_enabled, FALSE),
  maintenance_mode = COALESCE(maintenance_mode, FALSE),
  maintenance_message = COALESCE(maintenance_message, 'النظام قيد الصيانة، يرجى المحاولة لاحقاً'),
  max_file_upload_size = COALESCE(max_file_upload_size, 10485760),
  allowed_file_types = COALESCE(allowed_file_types, ARRAY['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','gif']),
  default_ticket_priority = COALESCE(default_ticket_priority, 'medium'),
  auto_assign_tickets = COALESCE(auto_assign_tickets, FALSE),
  ticket_numbering_format = COALESCE(ticket_numbering_format, 'TKT-{YYYY}-{MM}-{####}'),
  frontend_url = COALESCE(frontend_url, 'http://localhost:8080'),
  api_base_url = COALESCE(api_base_url, 'http://localhost:3003'),
  updated_at = NOW();

-- إخراج نتيجة المزامنة
SELECT 
  'تمت مزامنة جدول settings مع البنية الحديثة بنجاح' AS message,
  row_to_json(settings) AS current_settings_snapshot
FROM settings
LIMIT 1;

