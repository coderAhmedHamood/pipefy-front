-- Migration: إنشاء جدول ربط المستخدمين بالتذاكر
-- الهدف: ربط المستخدمين بالتذاكر مع تتبع حالة المعالجة
-- التاريخ: 2025-01-XX

-- جدول ربط المستخدمين بالتذاكر (user_ticket_links)
CREATE TABLE IF NOT EXISTS user_ticket_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'جاري المعالجة' CHECK (status IN ('جاري المعالجة', 'تمت المعالجة', 'منتهية')),
  from_process_name VARCHAR(255),
  to_process_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- منع تكرار نفس الربط (نفس المستخدم + نفس التذكرة)
  UNIQUE(user_id, ticket_id)
);

-- فهارس جدول ربط المستخدمين بالتذاكر
CREATE INDEX IF NOT EXISTS idx_user_ticket_links_user ON user_ticket_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ticket_links_ticket ON user_ticket_links(ticket_id);
CREATE INDEX IF NOT EXISTS idx_user_ticket_links_status ON user_ticket_links(status);
CREATE INDEX IF NOT EXISTS idx_user_ticket_links_user_ticket ON user_ticket_links(user_id, ticket_id);
CREATE INDEX IF NOT EXISTS idx_user_ticket_links_created_at ON user_ticket_links(created_at);

-- إضافة تعليقات للجدول والأعمدة
COMMENT ON TABLE user_ticket_links IS 'جدول ربط المستخدمين بالتذاكر مع تتبع حالة المعالجة وأسماء العمليات';
COMMENT ON COLUMN user_ticket_links.status IS 'حالة المعالجة: جاري المعالجة، تمت المعالجة، منتهية';
COMMENT ON COLUMN user_ticket_links.from_process_name IS 'اسم العملية المصدر (من أين قادمة)';
COMMENT ON COLUMN user_ticket_links.to_process_name IS 'اسم العملية الهدف (إلى أين قادمة)';

-- عرض رسالة نجاح
SELECT 
  '✅ تم إنشاء جدول user_ticket_links بنجاح' as message,
  COUNT(*) as total_links
FROM user_ticket_links;

