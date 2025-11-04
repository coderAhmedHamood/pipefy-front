-- Migration: إضافة صلاحيات إدارة التذاكر (المسندين والمراجعين)
-- الهدف: إضافة صلاحيات جديدة لإدارة المسندين والمراجعين وعرض التذاكر الخاصة
-- التاريخ: 2025-11-04

-- إضافة الصلاحيات الجديدة
INSERT INTO permissions (name, resource, action, description) VALUES
  -- 1. عرض التذاكر الخاصة بالموظف فقط (إذا لم تكن موجودة)
  ('عرض التذاكر الخاصة', 'tickets', 'view_own', 'عرض التذاكر الخاصة بالمستخدم فقط')
ON CONFLICT (resource, action) DO NOTHING;

-- 2. عرض المراجعين وتقييم المراجعين
INSERT INTO permissions (name, resource, action, description) VALUES
  ('عرض المراجعين وتقييم المراجعين', 'ticket_reviewers', 'view', 'عرض المراجعين وتقييم المراجعين للتذاكر')
ON CONFLICT (resource, action) DO NOTHING;

-- 3. إضافة مسندين إلى التذكرة
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إضافة مسندين إلى التذكرة', 'ticket_assignees', 'create', 'إضافة مستخدمين مسندين إلى التذاكر')
ON CONFLICT (resource, action) DO NOTHING;

-- 4. إضافة مراجعين إلى التذكرة
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إضافة مراجعين إلى التذكرة', 'ticket_reviewers', 'create', 'إضافة مراجعين إلى التذاكر')
ON CONFLICT (resource, action) DO NOTHING;

-- ربط جميع الصلاحيات الجديدة بدور المدير (admin)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.resource IN ('tickets', 'ticket_reviewers', 'ticket_assignees')
  AND p.action IN ('view_own', 'view', 'create')
  AND (
    (p.resource = 'tickets' AND p.action = 'view_own') OR
    (p.resource = 'ticket_reviewers' AND p.action IN ('view', 'create')) OR
    (p.resource = 'ticket_assignees' AND p.action = 'create')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- عرض رسالة نجاح
SELECT
    'تم إضافة صلاحيات إدارة التذاكر بنجاح' as message,
    COUNT(*) as permissions_count
FROM permissions
WHERE resource IN ('ticket_reviewers', 'ticket_assignees')
  AND action IN ('view', 'create');

