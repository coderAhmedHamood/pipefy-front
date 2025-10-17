-- البحث عن مستخدم لديه تذاكر
-- قم بتشغيل هذا الاستعلام في pgAdmin أو أي أداة PostgreSQL

-- 1. جلب جميع المستخدمين مع عدد تذاكرهم
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(t.id) as ticket_count
FROM users u
LEFT JOIN tickets t ON t.assigned_to = u.id AND t.deleted_at IS NULL
GROUP BY u.id, u.name, u.email
ORDER BY ticket_count DESC;

-- 2. جلب المستخدم المحدد (إذا كان موجوداً)
SELECT * FROM users WHERE id = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

-- 3. جلب تذاكر المستخدم المحدد
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.status,
  t.assigned_to
FROM tickets t
WHERE t.assigned_to = 'd6f7574c-d937-4e55-8cb1-0b19269e6061'
  AND t.deleted_at IS NULL
LIMIT 10;

-- 4. التحقق من جدول ticket_assignments
SELECT * FROM ticket_assignments 
WHERE user_id = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';
