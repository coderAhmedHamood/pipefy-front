-- إضافة نوع نشاط حذف المرفق
-- Migration 007: Add attachment_deleted activity type

-- إضافة attachment_deleted إلى قائمة الأنواع المسموحة
ALTER TABLE ticket_activities 
DROP CONSTRAINT IF EXISTS ticket_activities_activity_type_check;

ALTER TABLE ticket_activities 
ADD CONSTRAINT ticket_activities_activity_type_check 
CHECK (activity_type IN (
  'created', 'updated', 'stage_changed', 'assigned', 'commented', 
  'attachment_added', 'attachment_deleted', 'field_updated', 'status_changed', 'completed'
));
