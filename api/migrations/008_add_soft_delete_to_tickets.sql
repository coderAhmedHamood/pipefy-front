-- إضافة دعم الحذف الناعم لجدول التذاكر
-- Migration: 008_add_soft_delete_to_tickets.sql

-- إضافة عمود deleted_at لجدول tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- إضافة فهرس للحذف الناعم
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON tickets(deleted_at);

-- إضافة فهرس مركب للاستعلامات الشائعة مع استبعاد المحذوف
CREATE INDEX IF NOT EXISTS idx_tickets_active ON tickets(process_id, current_stage_id) WHERE deleted_at IS NULL;

-- تحديث دالة generate_ticket_number لتتجاهل التذاكر المحذوفة نعومياً
CREATE OR REPLACE FUNCTION generate_ticket_number(p_process_id UUID)
RETURNS TEXT AS $$
DECLARE
  process_name TEXT;
  counter INTEGER;
  ticket_number TEXT;
BEGIN
  -- جلب اسم العملية
  SELECT UPPER(LEFT(name, 3)) INTO process_name FROM processes WHERE id = p_process_id;
  
  IF process_name IS NULL THEN
    RAISE EXCEPTION 'العملية غير موجودة';
  END IF;

  -- جلب العداد التالي (تجاهل التذاكر المحذوفة نعومياً)
  SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO counter
  FROM tickets t
  WHERE t.process_id = p_process_id 
    AND t.deleted_at IS NULL;  -- تجاهل المحذوف نعومياً

  -- تكوين رقم التذكرة
  ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0');

  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- إضافة دالة للحذف الناعم
CREATE OR REPLACE FUNCTION soft_delete_ticket(p_ticket_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE tickets 
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_ticket_id AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- إضافة دالة لاستعادة التذكرة المحذوفة نعومياً
CREATE OR REPLACE FUNCTION restore_ticket(p_ticket_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE tickets 
  SET deleted_at = NULL, updated_at = NOW()
  WHERE id = p_ticket_id AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- تحديث view للتذاكر النشطة (غير المحذوفة)
CREATE OR REPLACE VIEW active_tickets AS
SELECT t.*, 
       p.name as process_name,
       p.color as process_color,
       s.name as stage_name,
       s.color as stage_color,
       u1.name as assigned_to_name,
       u2.name as created_by_name
FROM tickets t
JOIN processes p ON t.process_id = p.id
JOIN stages s ON t.current_stage_id = s.id
LEFT JOIN users u1 ON t.assigned_to = u1.id
LEFT JOIN users u2 ON t.created_by = u2.id
WHERE t.deleted_at IS NULL;

COMMENT ON TABLE tickets IS 'جدول التذاكر مع دعم الحذف الناعم';
COMMENT ON COLUMN tickets.deleted_at IS 'تاريخ الحذف الناعم - NULL يعني أن التذكرة نشطة';
