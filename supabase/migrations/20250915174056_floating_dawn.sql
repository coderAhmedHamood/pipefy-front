/*
  # إنشاء المخطط الأولي لنظام إدارة العمليات والتذاكر

  1. الجداول الأساسية
    - `profiles` - ملفات المستخدمين الشخصية
    - `roles` - أدوار المستخدمين
    - `permissions` - الصلاحيات
    - `role_permissions` - ربط الأدوار بالصلاحيات
    - `user_permissions` - صلاحيات إضافية للمستخدمين

  2. جداول العمليات
    - `processes` - العمليات الأساسية
    - `stages` - مراحل العمليات
    - `process_fields` - الحقول المخصصة للعمليات
    - `stage_transitions` - قواعد الانتقال بين المراحل

  3. جداول التذاكر
    - `tickets` - التذاكر الأساسية
    - `ticket_activities` - سجل الأنشطة
    - `ticket_comments` - التعليقات
    - `ticket_attachments` - المرفقات

  4. الأمان
    - تفعيل RLS على جميع الجداول
    - إنشاء السياسات الأمنية المناسبة
*/

-- تفعيل الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- جدول الملفات الشخصية للمستخدمين
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الصلاحيات
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource, action)
);

-- جدول ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- جدول الصلاحيات الإضافية للمستخدمين
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id)
);

-- جدول العمليات
CREATE TABLE IF NOT EXISTS processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  icon TEXT DEFAULT 'FolderOpen',
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المراحل
CREATE TABLE IF NOT EXISTS stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-gray-500',
  priority INTEGER NOT NULL DEFAULT 1,
  is_initial BOOLEAN DEFAULT FALSE,
  is_final BOOLEAN DEFAULT FALSE,
  sla_hours INTEGER,
  required_permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(process_id, priority)
);

-- جدول قواعد الانتقال بين المراحل
CREATE TABLE IF NOT EXISTS stage_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  to_stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  transition_type TEXT DEFAULT 'single' CHECK (transition_type IN ('single', 'multiple')),
  conditions JSONB DEFAULT '[]',
  required_permissions TEXT[] DEFAULT '{}',
  is_automatic BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  confirmation_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_stage_id, to_stage_id)
);

-- جدول الحقول المخصصة للعمليات
CREATE TABLE IF NOT EXISTS process_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  is_system_field BOOLEAN DEFAULT FALSE,
  default_value JSONB,
  options JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '[]',
  help_text TEXT,
  placeholder TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التذاكر
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  process_id UUID NOT NULL REFERENCES processes(id),
  current_stage_id UUID NOT NULL REFERENCES stages(id),
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  parent_ticket_id UUID REFERENCES tickets(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول أنشطة التذاكر
CREATE TABLE IF NOT EXISTS ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  field_name TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تعليقات التذاكر
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  mentions UUID[] DEFAULT '{}',
  parent_comment_id UUID REFERENCES ticket_comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول مرفقات التذاكر
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول العلامات
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT 'bg-gray-100 text-gray-800',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول ربط التذاكر بالعلامات
CREATE TABLE IF NOT EXISTS ticket_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, tag_id)
);

-- جدول قواعد الأتمتة
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التذاكر المتكررة
CREATE TABLE IF NOT EXISTS recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  schedule_config JSONB NOT NULL,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  is_active BOOLEAN DEFAULT TRUE,
  next_execution TIMESTAMPTZ NOT NULL,
  last_executed TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التكاملات الخارجية
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('webhook', 'rest_api', 'graphql', 'email')),
  endpoint TEXT NOT NULL,
  http_method TEXT DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  authentication JSONB DEFAULT '{}',
  trigger_events TEXT[] NOT NULL,
  payload_template JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدراج الأدوار الأساسية
INSERT INTO roles (id, name, description, is_system_role) VALUES
  ('admin', 'مدير النظام', 'صلاحيات كاملة لإدارة النظام', TRUE),
  ('member', 'عضو', 'صلاحيات أساسية للعمل', TRUE),
  ('guest', 'ضيف', 'صلاحيات محدودة للعرض فقط', TRUE)
ON CONFLICT (name) DO NOTHING;

-- إدراج الصلاحيات الأساسية
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إنشاء التذاكر', 'tickets', 'create', 'إنشاء تذاكر جديدة'),
  ('تعديل التذاكر', 'tickets', 'edit', 'تعديل التذاكر الموجودة'),
  ('حذف التذاكر', 'tickets', 'delete', 'حذف التذاكر'),
  ('عرض جميع التذاكر', 'tickets', 'view_all', 'عرض جميع التذاكر في النظام'),
  ('إدارة العمليات', 'processes', 'manage', 'إنشاء وتعديل العمليات'),
  ('إدارة المستخدمين', 'users', 'manage', 'إدارة حسابات المستخدمين'),
  ('عرض التقارير', 'reports', 'view', 'الوصول للتقارير والإحصائيات'),
  ('إعدادات النظام', 'system', 'settings', 'تعديل إعدادات النظام'),
  ('إدارة الأتمتة', 'automation', 'manage', 'إنشاء وتعديل قواعد الأتمتة'),
  ('إدارة التكاملات', 'integrations', 'manage', 'إدارة التكاملات الخارجية')
ON CONFLICT (resource, action) DO NOTHING;

-- ربط الأدوار بالصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- صلاحيات محدودة للأعضاء
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'member' 
  AND p.action IN ('create', 'edit', 'view_all')
  AND p.resource IN ('tickets', 'reports')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- دالة لإنشاء رقم تذكرة تلقائي
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  process_prefix TEXT;
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  -- جلب بادئة العملية (أول 3 أحرف من اسم العملية)
  SELECT UPPER(LEFT(name, 3)) INTO process_prefix
  FROM processes WHERE id = NEW.process_id;
  
  -- السنة الحالية
  year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- الرقم التسلسلي
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM tickets 
  WHERE ticket_number LIKE process_prefix || '-' || year_suffix || '-%';
  
  -- تكوين رقم التذكرة
  NEW.ticket_number := process_prefix || '-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق دالة إنشاء رقم التذكرة
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق دالة التحديث على الجداول المطلوبة
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- تفعيل Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للملفات الشخصية
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.resource = 'users' AND p.action = 'manage'
    )
  );

-- سياسات الأمان للعمليات
CREATE POLICY "Users can view active processes"
  ON processes FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Process managers can manage processes"
  ON processes FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.resource = 'processes' AND p.action = 'manage'
    )
  );

-- سياسات الأمان للتذاكر
CREATE POLICY "Users can view tickets they have access to"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.resource = 'tickets' AND p.action = 'view_all'
    )
  );

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.resource = 'tickets' AND p.action = 'create'
    )
  );

CREATE POLICY "Users can update tickets they have access to"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.resource = 'tickets' AND p.action = 'edit'
    )
  );

-- سياسات الأمان للإشعارات
CREATE POLICY "Users can only see their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- سياسات الأمان للأنشطة
CREATE POLICY "Users can view activities for accessible tickets"
  ON ticket_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_activities.ticket_id
        AND (
          t.created_by = auth.uid() OR
          t.assigned_to = auth.uid() OR
          EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN profiles pr ON pr.id = auth.uid()
            WHERE p.resource = 'tickets' AND p.action = 'view_all'
          )
        )
    )
  );

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_processes_active ON processes(is_active);
CREATE INDEX IF NOT EXISTS idx_stages_process_priority ON stages(process_id, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_process_stage ON tickets(process_id, current_stage_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket ON ticket_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_created ON ticket_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_stage_transitions_from ON stage_transitions(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_transitions_to ON stage_transitions(to_stage_id);

-- فهرس للبحث النصي
CREATE INDEX IF NOT EXISTS idx_tickets_search ON tickets 
USING GIN (to_tsvector('arabic', title || ' ' || COALESCE(description, '')));