-- Migration: إنشاء نظام إسناد التذاكر والمراجعة والتقييم بشكل كامل
-- الهدف: ضمان وجود جميع الجداول والـ constraints المطلوبة للـ endpoints
-- التاريخ: 2025-11-23
-- 
-- هذا الـ migration يضمن:
-- 1. إنشاء جدول ticket_assignments (مستخدم في ReportController)
-- 2. إصلاح جدول ticket_reviewers مع constraint صحيح
-- 3. إنشاء جدول evaluation_criteria
-- 4. إنشاء جدول ticket_evaluations
-- 5. إنشاء جدول ticket_evaluation_summary
-- 6. إنشاء جميع الفهارس المطلوبة

-- ===== 1. إنشاء جدول ticket_assignments (إسناد التذاكر) =====
CREATE TABLE IF NOT EXISTS ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  role VARCHAR(100), -- دور المستخدم في التذكرة (مثل: developer, designer, tester)
  notes TEXT, -- ملاحظات الإسناد
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, user_id) -- منع تكرار إسناد نفس المستخدم لنفس التذكرة
);

-- فهارس جدول ticket_assignments
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket ON ticket_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_user ON ticket_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_active ON ticket_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_assigned_by ON ticket_assignments(assigned_by);

-- ===== 2. إصلاح جدول ticket_reviewers =====
-- التأكد من وجود جميع الأعمدة المطلوبة
DO $$
BEGIN
  -- إضافة الأعمدة إذا لم تكن موجودة
  ALTER TABLE ticket_reviewers
    ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rate VARCHAR(20),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  
  -- تغيير أسماء الأعمدة القديمة إذا لزم الأمر
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'reviewer_id'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN user_id TO reviewer_id;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'assigned_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'added_by'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN assigned_by TO added_by;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'assigned_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'added_at'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN assigned_at TO added_at;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN status TO review_status;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'notes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE ticket_reviewers RENAME COLUMN notes TO review_notes;
  END IF;
  
  -- تحديث القيم الافتراضية
  UPDATE ticket_reviewers
  SET review_status = COALESCE(review_status, 'pending')
  WHERE review_status IS NULL;
END $$;

-- إزالة جميع constraints القديمة المتعلقة بـ status/review_status
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'ticket_reviewers'::regclass
    AND (
      conname LIKE '%status%check%' 
      OR conname LIKE '%review_status%check%'
      OR conname = 'ticket_reviewers_status_check'
      OR conname = 'ticket_reviewers_review_status_check'
    )
  LOOP
    EXECUTE 'ALTER TABLE ticket_reviewers DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_record.conname);
  END LOOP;
END $$;

-- إضافة constraint جديد شامل لـ review_status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' 
    AND column_name = 'review_status'
  ) THEN
    -- إضافة constraint جديد مع جميع القيم المستخدمة في الكود
    ALTER TABLE ticket_reviewers 
    ADD CONSTRAINT ticket_reviewers_review_status_check 
    CHECK (review_status IN ('pending', 'in_progress', 'completed', 'skipped', 'reviewed', 'rejected'));
  END IF;
  
  -- إذا كان العمود اسمه status (وليس review_status)
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
    ALTER TABLE ticket_reviewers 
    ADD CONSTRAINT ticket_reviewers_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'reviewed', 'rejected'));
  END IF;
END $$;

-- إضافة constraint لـ rate إذا لم يكن موجوداً
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' 
    AND column_name = 'rate'
  ) THEN
    -- التحقق من وجود constraint على rate
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conrelid = 'ticket_reviewers'::regclass 
      AND conname LIKE '%rate%check%'
    ) THEN
      ALTER TABLE ticket_reviewers 
      ADD CONSTRAINT ticket_reviewers_rate_check 
      CHECK (rate IN ('ضعيف', 'جيد', 'جيد جدا', 'ممتاز') OR rate IS NULL);
    END IF;
  END IF;
END $$;

-- تحديث UNIQUE constraint ليشمل reviewer_id بدلاً من user_id
DO $$
BEGIN
  -- إزالة constraint القديم إذا كان موجوداً
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'ticket_reviewers'::regclass 
    AND conname LIKE '%ticket_reviewers%user%'
  ) THEN
    ALTER TABLE ticket_reviewers 
    DROP CONSTRAINT IF EXISTS ticket_reviewers_ticket_id_user_id_key;
  END IF;
  
  -- إضافة constraint جديد على (ticket_id, reviewer_id)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_name = 'ticket_reviewers' 
    AND column_name = 'reviewer_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conrelid = 'ticket_reviewers'::regclass 
      AND conname = 'ticket_reviewers_ticket_id_reviewer_id_key'
    ) THEN
      ALTER TABLE ticket_reviewers 
      ADD CONSTRAINT ticket_reviewers_ticket_id_reviewer_id_key 
      UNIQUE(ticket_id, reviewer_id);
    END IF;
  END IF;
END $$;

-- إنشاء/تحديث الفهارس لـ ticket_reviewers
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_ticket ON ticket_reviewers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_reviewer ON ticket_reviewers(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_status ON ticket_reviewers(review_status);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_active ON ticket_reviewers(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_rate ON ticket_reviewers(rate);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_added_at ON ticket_reviewers(added_at);

-- ===== 3. إنشاء جدول evaluation_criteria (معايير التقييم) =====
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  description TEXT,
  category VARCHAR(100), -- IT, HR, Sales, Support, General
  options JSONB NOT NULL, -- خيارات التقييم مثل: ["Excellent", "Good", "Fair", "Poor"]
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, category)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_category ON evaluation_criteria(category);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_active ON evaluation_criteria(is_active);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_display_order ON evaluation_criteria(display_order);

-- ===== 4. إنشاء جدول ticket_evaluations (التقييمات الفعلية) =====
CREATE TABLE IF NOT EXISTS ticket_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  rating VARCHAR(100) NOT NULL, -- القيمة المختارة من options
  score DECIMAL(5,2), -- درجة رقمية اختيارية
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, reviewer_id, criteria_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_ticket ON ticket_evaluations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_reviewer ON ticket_evaluations(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_criteria ON ticket_evaluations(criteria_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluations_evaluated_at ON ticket_evaluations(evaluated_at);

-- ===== 5. إنشاء جدول ticket_evaluation_summary (ملخص التقييمات) =====
CREATE TABLE IF NOT EXISTS ticket_evaluation_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
  total_reviewers INTEGER DEFAULT 0,
  completed_reviews INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  overall_rating VARCHAR(50), -- Excellent, Good, Fair, Poor
  evaluation_data JSONB, -- تخزين ملخص مفصل للتقييمات
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_ticket ON ticket_evaluation_summary(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_rating ON ticket_evaluation_summary(overall_rating);
CREATE INDEX IF NOT EXISTS idx_ticket_evaluation_summary_completed ON ticket_evaluation_summary(completed_at);

-- ===== 6. إنشاء جدول user_processes (ربط المستخدمين بالعمليات) =====
CREATE TABLE IF NOT EXISTS user_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, process_id)
);

CREATE INDEX IF NOT EXISTS idx_user_processes_user ON user_processes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_processes_process ON user_processes(process_id);
CREATE INDEX IF NOT EXISTS idx_user_processes_active ON user_processes(is_active);

-- ===== 7. عرض رسالة نجاح مع الإحصائيات =====
SELECT 
  '✅ تم إنشاء/تحديث جميع جداول نظام الإسناد والمراجعة والتقييم بنجاح' as message,
  (SELECT COUNT(*) FROM ticket_assignments) as total_assignments,
  (SELECT COUNT(*) FROM ticket_reviewers) as total_reviewers,
  (SELECT COUNT(*) FROM evaluation_criteria) as total_criteria,
  (SELECT COUNT(*) FROM ticket_evaluations) as total_evaluations,
  (SELECT COUNT(*) FROM ticket_evaluation_summary) as total_summaries,
  (SELECT COUNT(*) FROM user_processes) as total_user_processes;

