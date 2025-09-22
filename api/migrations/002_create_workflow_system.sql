-- إنشاء نظام إدارة العمليات والمراحل والحقول
-- Migration: 002_create_workflow_system.sql

-- جدول العمليات (processes)
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'FolderOpen',
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- فهارس جدول العمليات
CREATE INDEX IF NOT EXISTS idx_processes_active ON processes(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_processes_created_by ON processes(created_by);
CREATE INDEX IF NOT EXISTS idx_processes_name ON processes(name) WHERE deleted_at IS NULL;

-- جدول المراحل (stages)
CREATE TABLE IF NOT EXISTS stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT '#6B7280',
  order_index INTEGER NOT NULL,
  priority INTEGER DEFAULT 1,
  is_initial BOOLEAN DEFAULT FALSE,
  is_final BOOLEAN DEFAULT FALSE,
  sla_hours INTEGER,
  required_permissions TEXT[] DEFAULT '{}',
  automation_rules JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_process_order UNIQUE(process_id, order_index),
  CONSTRAINT unique_process_priority UNIQUE(process_id, priority),
  CONSTRAINT check_order_positive CHECK (order_index > 0),
  CONSTRAINT check_priority_positive CHECK (priority > 0)
);

-- فهارس جدول المراحل
CREATE INDEX IF NOT EXISTS idx_stages_process ON stages(process_id);
CREATE INDEX IF NOT EXISTS idx_stages_order ON stages(process_id, order_index);
CREATE INDEX IF NOT EXISTS idx_stages_priority ON stages(process_id, priority);
CREATE INDEX IF NOT EXISTS idx_stages_initial ON stages(process_id, is_initial);
CREATE INDEX IF NOT EXISTS idx_stages_final ON stages(process_id, is_final);

-- جدول قواعد الانتقال بين المراحل (stage_transitions)
CREATE TABLE IF NOT EXISTS stage_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  to_stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  transition_type VARCHAR(20) DEFAULT 'manual' CHECK (transition_type IN ('manual', 'automatic', 'conditional')),
  conditions JSONB DEFAULT '[]',
  required_permissions TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  display_name VARCHAR(255),
  confirmation_required BOOLEAN DEFAULT FALSE,
  button_color VARCHAR(50) DEFAULT '#3B82F6',
  button_icon VARCHAR(50),
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_stage_transition UNIQUE(from_stage_id, to_stage_id)
);

-- فهارس جدول قواعد الانتقال
CREATE INDEX IF NOT EXISTS idx_transitions_from_stage ON stage_transitions(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_transitions_to_stage ON stage_transitions(to_stage_id);
CREATE INDEX IF NOT EXISTS idx_transitions_type ON stage_transitions(transition_type);

-- جدول حقول العمليات (process_fields)
CREATE TABLE IF NOT EXISTS process_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN (
    'text', 'textarea', 'number', 'email', 'phone', 'url', 'date', 'datetime', 
    'time', 'select', 'multiselect', 'radio', 'checkbox', 'file', 'image', 
    'user', 'department', 'currency', 'percentage', 'rating', 'color'
  )),
  is_required BOOLEAN DEFAULT FALSE,
  is_system_field BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,
  is_filterable BOOLEAN DEFAULT TRUE,
  default_value JSONB,
  options JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '[]',
  help_text TEXT,
  placeholder TEXT,
  order_index INTEGER DEFAULT 1,
  group_name VARCHAR(255),
  width VARCHAR(20) DEFAULT 'full' CHECK (width IN ('full', 'half', 'third', 'quarter')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_process_field_name UNIQUE(process_id, name),
  CONSTRAINT unique_process_field_order UNIQUE(process_id, order_index)
);

-- فهارس جدول حقول العمليات
CREATE INDEX IF NOT EXISTS idx_process_fields_process ON process_fields(process_id);
CREATE INDEX IF NOT EXISTS idx_process_fields_type ON process_fields(field_type);
CREATE INDEX IF NOT EXISTS idx_process_fields_order ON process_fields(process_id, order_index);
CREATE INDEX IF NOT EXISTS idx_process_fields_group ON process_fields(process_id, group_name);

-- جدول حقول المراحل (stage_fields)
CREATE TABLE IF NOT EXISTS stage_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES process_fields(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT TRUE,
  is_editable BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 1,
  conditional_logic JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_stage_field UNIQUE(stage_id, field_id),
  CONSTRAINT unique_stage_field_order UNIQUE(stage_id, order_index)
);

-- فهارس جدول حقول المراحل
CREATE INDEX IF NOT EXISTS idx_stage_fields_stage ON stage_fields(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_fields_field ON stage_fields(field_id);
CREATE INDEX IF NOT EXISTS idx_stage_fields_order ON stage_fields(stage_id, order_index);

-- جدول التذاكر (tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  process_id UUID NOT NULL REFERENCES processes(id),
  current_stage_id UUID NOT NULL REFERENCES stages(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  parent_ticket_id UUID REFERENCES tickets(id),
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول التذاكر
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_process ON tickets(process_id);
CREATE INDEX IF NOT EXISTS idx_tickets_stage ON tickets(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_tickets_parent ON tickets(parent_ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_data ON tickets USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_tickets_tags ON tickets USING GIN(tags);

-- جدول أنشطة التذاكر (ticket_activities)
CREATE TABLE IF NOT EXISTS ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'created', 'updated', 'stage_changed', 'assigned', 'commented', 
    'attachment_added', 'field_updated', 'status_changed', 'completed'
  )),
  description TEXT NOT NULL,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول أنشطة التذاكر
CREATE INDEX IF NOT EXISTS idx_activities_ticket ON ticket_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON ticket_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON ticket_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON ticket_activities(created_at);

-- جدول تعليقات التذاكر (ticket_comments)
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES ticket_comments(id),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول تعليقات التذاكر
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON ticket_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON ticket_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON ticket_comments(created_at);

-- جدول مرفقات التذاكر (ticket_attachments)
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  is_image BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول مرفقات التذاكر
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_comment ON ticket_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON ticket_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON ticket_attachments(created_at);

-- جدول قواعد الأتمتة (automation_rules)
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
  trigger_event VARCHAR(50) NOT NULL CHECK (trigger_event IN (
    'ticket_created', 'stage_changed', 'field_updated', 'assigned',
    'overdue', 'comment_added', 'attachment_added', 'status_changed'
  )),
  trigger_conditions JSONB DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول قواعد الأتمتة
CREATE INDEX IF NOT EXISTS idx_automation_process ON automation_rules(process_id);
CREATE INDEX IF NOT EXISTS idx_automation_stage ON automation_rules(stage_id);
CREATE INDEX IF NOT EXISTS idx_automation_trigger ON automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automation_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_created_by ON automation_rules(created_by);

-- جدول سجل تنفيذ الأتمتة (automation_executions)
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  actions_executed JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول سجل تنفيذ الأتمتة
CREATE INDEX IF NOT EXISTS idx_executions_rule ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_executions_ticket ON automation_executions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_executed ON automation_executions(executed_at);

-- جدول التذاكر المتكررة (recurring_rules)
CREATE TABLE IF NOT EXISTS recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  schedule_config JSONB NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  is_active BOOLEAN DEFAULT TRUE,
  next_execution TIMESTAMPTZ NOT NULL,
  last_executed TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول التذاكر المتكررة
CREATE INDEX IF NOT EXISTS idx_recurring_process ON recurring_rules(process_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_execution ON recurring_rules(next_execution);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_type ON recurring_rules(schedule_type);

-- دالة لتوليد رقم التذكرة
CREATE OR REPLACE FUNCTION generate_ticket_number(p_process_id UUID)
RETURNS TEXT AS $$
DECLARE
  process_name TEXT;
  counter INTEGER;
  ticket_number TEXT;
BEGIN
  -- جلب اسم العملية
  SELECT UPPER(LEFT(name, 3)) INTO process_name FROM processes WHERE id = p_process_id;

  -- جلب العداد التالي
  SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO counter
  FROM tickets t
  WHERE t.process_id = p_process_id;

  -- تكوين رقم التذكرة
  ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0');

  RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- دالة لإعادة ترتيب المراحل
CREATE OR REPLACE FUNCTION reorder_stages(process_id UUID)
RETURNS VOID AS $$
DECLARE
  stage_record RECORD;
  new_order INTEGER := 1;
BEGIN
  FOR stage_record IN 
    SELECT id FROM stages 
    WHERE stages.process_id = reorder_stages.process_id 
    ORDER BY order_index, created_at
  LOOP
    UPDATE stages 
    SET order_index = new_order 
    WHERE id = stage_record.id;
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- دالة لإعادة ترتيب الحقول
CREATE OR REPLACE FUNCTION reorder_process_fields(process_id UUID)
RETURNS VOID AS $$
DECLARE
  field_record RECORD;
  new_order INTEGER := 1;
BEGIN
  FOR field_record IN 
    SELECT id FROM process_fields 
    WHERE process_fields.process_id = reorder_process_fields.process_id 
    ORDER BY order_index, created_at
  LOOP
    UPDATE process_fields 
    SET order_index = new_order 
    WHERE id = field_record.id;
    new_order := new_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
