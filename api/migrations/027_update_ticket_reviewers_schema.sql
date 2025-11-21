-- Migration: تحديث بنية جدول ticket_reviewers للتوافق مع النظام الحالي
-- الهدف: توحيد أسماء الأعمدة وضمان وجود الحقول المطلوبة
-- التاريخ: 2025-11-11

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'reviewer_id'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN user_id TO reviewer_id;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'assigned_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'added_by'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN assigned_by TO added_by;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'assigned_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN assigned_at TO added_at;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN status TO review_status;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'notes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN notes TO review_notes;
  END IF;
END$$;

ALTER TABLE ticket_reviewers
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS review_notes TEXT,
  ADD COLUMN IF NOT EXISTS rate VARCHAR(20) CHECK (rate IN ('ضعيف', 'جيد', 'جيد جدا', 'ممتاز')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- تحديث القيم الافتراضية للحالات القديمة
UPDATE ticket_reviewers
SET review_status = COALESCE(review_status, 'pending');

-- إنشاء الفهارس لضمان الأداء
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_ticket ON ticket_reviewers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_reviewer ON ticket_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_status ON ticket_reviewers(review_status);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_active ON ticket_reviewers(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_rate ON ticket_reviewers(rate);

SELECT 
  'تم تحديث بنية جدول ticket_reviewers بنجاح' AS message,
  COUNT(*) AS total_reviewers
FROM ticket_reviewers;




