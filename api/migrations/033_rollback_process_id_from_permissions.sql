-- Migration: التراجع عن إضافة process_id إلى جدول permissions
-- الهدف: إزالة حقل process_id من جدول permissions (الصلاحيات عامة)
-- التاريخ: 2025-11-16

-- 1. إزالة UNIQUE constraint الجديد
ALTER TABLE permissions 
DROP CONSTRAINT IF EXISTS permissions_resource_action_process_key;

-- 2. إزالة الـ constraint القديم إذا كان موجوداً بأي اسم
-- محاولة إزالة constraint بأسماء محتملة مختلفة
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_resource_action_key;

-- محاولة إزالة constraint بأسماء أخرى محتملة (إذا كان PostgreSQL أنشأه تلقائياً)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- البحث عن UNIQUE constraint يحتوي على resource و action فقط
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    WHERE c.conrelid = 'permissions'::regclass
    AND c.contype = 'u'
    AND array_length(c.conkey, 1) = 2
    AND EXISTS (
        SELECT 1
        FROM unnest(c.conkey) AS key1
        JOIN pg_attribute a1 ON a1.attrelid = c.conrelid AND a1.attnum = key1 AND a1.attname = 'resource'
    )
    AND EXISTS (
        SELECT 1
        FROM unnest(c.conkey) AS key2
        JOIN pg_attribute a2 ON a2.attrelid = c.conrelid AND a2.attnum = key2 AND a2.attname = 'action'
    )
    LIMIT 1;
    
    -- إذا وجد constraint، قم بإزالته
    IF constraint_name IS NOT NULL AND constraint_name != 'permissions_resource_action_key' THEN
        EXECUTE 'ALTER TABLE permissions DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END IF;
END $$;

-- 3. إعادة UNIQUE constraint الأصلي (فقط إذا لم يكن موجوداً)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'permissions'::regclass 
        AND conname = 'permissions_resource_action_key'
    ) THEN
        ALTER TABLE permissions 
        ADD CONSTRAINT permissions_resource_action_key UNIQUE(resource, action);
    END IF;
END $$;

-- 4. إزالة الفهارس المركبة
DROP INDEX IF EXISTS idx_permissions_resource_action_process;
DROP INDEX IF EXISTS idx_permissions_process_id;

-- 5. إزالة العمود process_id
ALTER TABLE permissions 
DROP COLUMN IF EXISTS process_id;

-- عرض رسالة نجاح
SELECT 
  'تم إزالة process_id من جدول permissions بنجاح' as message,
  COUNT(*) as total_permissions
FROM permissions;


