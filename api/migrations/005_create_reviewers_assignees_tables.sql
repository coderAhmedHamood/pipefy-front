-- Migration: إنشاء جداول المراجعين والمسندين للتذاكر
-- Created: 2025-09-25

-- جدول مراجعي التذاكر (ticket_reviewers)
CREATE TABLE IF NOT EXISTS ticket_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- منع تكرار نفس المراجع للتذكرة الواحدة
  UNIQUE(ticket_id, user_id)
);

-- جدول مسندي التذاكر (ticket_assignees)
CREATE TABLE IF NOT EXISTS ticket_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'removed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- منع تكرار نفس المسند للتذكرة الواحدة
  UNIQUE(ticket_id, user_id)
);

-- فهارس جدول مراجعي التذاكر
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_ticket ON ticket_reviewers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_user ON ticket_reviewers(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_assigned_by ON ticket_reviewers(assigned_by);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_status ON ticket_reviewers(status);
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_assigned_at ON ticket_reviewers(assigned_at);

-- فهارس جدول مسندي التذاكر
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_ticket ON ticket_assignees(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_user ON ticket_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_assigned_by ON ticket_assignees(assigned_by);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_status ON ticket_assignees(status);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_assigned_at ON ticket_assignees(assigned_at);

-- فهرس مركب للبحث السريع عن المراجعين النشطين
CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_active 
ON ticket_reviewers(ticket_id, status) 
WHERE status = 'pending';

-- فهرس مركب للبحث السريع عن المسندين النشطين
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_active 
ON ticket_assignees(ticket_id, status) 
WHERE status = 'active';

-- إضافة تعليقات للجداول
COMMENT ON TABLE ticket_reviewers IS 'جدول مراجعي التذاكر - يحتوي على المستخدمين المكلفين بمراجعة التذاكر';
COMMENT ON TABLE ticket_assignees IS 'جدول مسندي التذاكر - يحتوي على المستخدمين المكلفين بالعمل على التذاكر';

-- إضافة تعليقات للأعمدة المهمة
COMMENT ON COLUMN ticket_reviewers.status IS 'حالة المراجعة: pending (في الانتظار), reviewed (تمت المراجعة), rejected (مرفوضة)';
COMMENT ON COLUMN ticket_assignees.status IS 'حالة الإسناد: active (نشط), completed (مكتمل), removed (محذوف)';
