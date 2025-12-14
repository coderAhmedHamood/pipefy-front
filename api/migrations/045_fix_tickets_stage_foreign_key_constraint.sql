-- Migration: إصلاح القيد الخارجي لتذاكر عند حذف المراحل
-- الهدف: السماح بحذف المراحل المرتبطة بتذاكر (مع حذف التذاكر تلقائياً)
-- التاريخ: 2025-01-XX
--
-- ملاحظة: هذا يسمح بحذف المراحل مع حذف التذاكر المرتبطة تلقائياً
-- يستخدم ON DELETE CASCADE لحذف التذاكر عند حذف المراحل
-- بدلاً من ذلك، يمكن استخدام ON DELETE SET NULL ولكن يتطلب جعل الحقل nullable

-- 1. حذف القيد الخارجي القديم
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_current_stage_id_fkey;

-- 2. إضافة القيد الخارجي الجديد مع ON DELETE CASCADE
-- هذا يعني أنه عند حذف مرحلة، سيتم حذف جميع التذاكر المرتبطة بها تلقائياً
ALTER TABLE tickets 
ADD CONSTRAINT tickets_current_stage_id_fkey 
FOREIGN KEY (current_stage_id) 
REFERENCES stages(id) 
ON DELETE CASCADE;

-- عرض رسالة نجاح
SELECT 
  '✅ تم إصلاح القيد الخارجي tickets_current_stage_id_fkey بنجاح' as message,
  COUNT(*) as total_tickets,
  COUNT(DISTINCT current_stage_id) as tickets_with_stages
FROM tickets;

