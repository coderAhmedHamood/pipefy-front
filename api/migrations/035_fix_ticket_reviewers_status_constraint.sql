-- Migration: إصلاح constraint حالة ticket_reviewers بشكل كامل
-- الهدف: تحديث constraint ليشمل جميع الحالات المستخدمة فعلياً في الكود
-- الحالات المستخدمة: pending, in_progress, completed, skipped, reviewed, rejected
-- التاريخ: 2025-11-23

-- إزالة جميع constraints القديمة المتعلقة بـ status
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
  -- البحث عن جميع constraints المتعلقة بـ status أو review_status
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'ticket_reviewers'::regclass
    AND (conname LIKE '%status%check%' OR conname LIKE '%review_status%check%')
  LOOP
    EXECUTE 'ALTER TABLE ticket_reviewers DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname);
  END LOOP;
END $$;

-- إضافة constraint جديد شامل لـ review_status
DO $$
BEGIN
  -- التحقق من وجود عمود review_status
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' 
    AND column_name = 'review_status'
  ) THEN
    -- إضافة constraint جديد مع جميع الحالات المستخدمة في الكود
    ALTER TABLE ticket_reviewers 
    ADD CONSTRAINT ticket_reviewers_review_status_check 
    CHECK (review_status IN ('pending', 'in_progress', 'completed', 'skipped', 'reviewed', 'rejected'));
    
    RAISE NOTICE 'تم إضافة constraint لـ review_status';
  END IF;
  
  -- إذا كان العمود اسمه status (وليس review_status) - للتوافق مع الإصدارات القديمة
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' 
    AND column_name = 'status'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'ticket_reviewers' 
      AND column_name = 'review_status'
    )
  ) THEN
    -- إضافة constraint جديد مع جميع الحالات المستخدمة في الكود
    ALTER TABLE ticket_reviewers 
    ADD CONSTRAINT ticket_reviewers_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'reviewed', 'rejected'));
    
    RAISE NOTICE 'تم إضافة constraint لـ status';
  END IF;
END $$;

-- تحديث القيم القديمة 'reviewed' إلى 'completed' إذا لزم الأمر (اختياري)
-- ملاحظة: نترك القيم كما هي لأن 'reviewed' و 'completed' كلاهما صالحان الآن

-- عرض رسالة نجاح
SELECT 
  'تم إصلاح constraint حالة ticket_reviewers بنجاح' as message,
  COUNT(*) as total_reviewers,
  COUNT(*) FILTER (WHERE review_status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE review_status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE review_status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE review_status = 'skipped') as skipped_count,
  COUNT(*) FILTER (WHERE review_status = 'reviewed') as reviewed_count,
  COUNT(*) FILTER (WHERE review_status = 'rejected') as rejected_count
FROM ticket_reviewers;

