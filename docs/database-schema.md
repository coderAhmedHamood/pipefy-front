# مخطط قاعدة البيانات - نظام إدارة العمليات

## نظرة عامة على قاعدة البيانات

### تقنيات قاعدة البيانات
- **نوع قاعدة البيانات**: PostgreSQL 15+
- **ORM المقترح**: Prisma أو TypeORM
- **نظام الهجرة**: Database Migrations
- **النسخ الاحتياطي**: يومي مع نسخ أسبوعية

---

## الجداول الأساسية

### جدول المستخدمين (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  language VARCHAR(5) DEFAULT 'ar',
  preferences JSONB DEFAULT '{}',
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- فهارس
  INDEX idx_users_email (email),
  INDEX idx_users_role (role_id),
  INDEX idx_users_active (is_active),
  INDEX idx_users_created (created_at)
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid() 
      AND up.permission = 'manage_users'
    )
  );
```

### جدول الأدوار (roles)
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name)
);

-- إدراج الأدوار الأساسية
INSERT INTO roles (id, name, description, is_system_role) VALUES
  ('admin', 'مدير النظام', 'صلاحيات كاملة لإدارة النظام', TRUE),
  ('member', 'عضو', 'صلاحيات أساسية للعمل', TRUE),
  ('guest', 'ضيف', 'صلاحيات محدودة للعرض فقط', TRUE);
```

### جدول الصلاحيات (permissions)
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resource, action)
);

-- إدراج الصلاحيات الأساسية
INSERT INTO permissions (name, resource, action, description) VALUES
  ('إنشاء التذاكر', 'tickets', 'create', 'إنشاء تذاكر جديدة'),
  ('تعديل التذاكر', 'tickets', 'edit', 'تعديل التذاكر الموجودة'),
  ('حذف التذاكر', 'tickets', 'delete', 'حذف التذاكر'),
  ('عرض جميع التذاكر', 'tickets', 'view_all', 'عرض جميع التذاكر في النظام'),
  ('إدارة العمليات', 'processes', 'manage', 'إنشاء وتعديل العمليات'),
  ('إدارة المستخدمين', 'users', 'manage', 'إدارة حسابات المستخدمين'),
  ('عرض التقارير', 'reports', 'view', 'الوصول للتقارير والإحصائيات'),
  ('إعدادات النظام', 'system', 'settings', 'تعديل إعدادات النظام');
```

### جدول صلاحيات الأدوار (role_permissions)
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_id, permission_id)
);
```

### جدول صلاحيات المستخدمين الإضافية (user_permissions)
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(user_id, permission_id)
);
```

---

## جداول العمليات والمراحل

### جدول العمليات (processes)
```sql
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT 'bg-blue-500',
  icon VARCHAR(50) DEFAULT 'FolderOpen',
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  INDEX idx_processes_active (is_active),
  INDEX idx_processes_created_by (created_by),
  INDEX idx_processes_name (name)
);

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view processes they have access to"
  ON processes FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE AND (
      -- منشئ العملية
      created_by = auth.uid() OR
      -- له صلاحية إدارة العمليات
      EXISTS (
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = auth.uid() 
        AND p.resource = 'processes'
        AND p.action IN ('manage', 'view_all')
      )
    )
  );
```

### جدول المراحل (stages)
```sql
CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) DEFAULT 'bg-gray-500',
  order_index INTEGER NOT NULL,
  is_initial BOOLEAN DEFAULT FALSE,
  is_final BOOLEAN DEFAULT FALSE,
  sla_hours INTEGER,
  required_permissions TEXT[],
  automation_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(process_id, order_index),
  INDEX idx_stages_process (process_id),
  INDEX idx_stages_order (process_id, order_index)
);
```

### جدول حقول العمليات (process_fields)
```sql
CREATE TABLE process_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  is_system_field BOOLEAN DEFAULT FALSE,
  default_value JSONB,
  options JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '[]',
  help_text TEXT,
  placeholder TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_process_fields_process (process_id),
  INDEX idx_process_fields_type (field_type),
  INDEX idx_process_fields_order (process_id, order_index)
);
```

---

## جداول التذاكر والأنشطة

### جدول التذاكر (tickets)
```sql
CREATE TABLE tickets (
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- فهارس للأداء
  INDEX idx_tickets_process_stage (process_id, current_stage_id),
  INDEX idx_tickets_assigned (assigned_to),
  INDEX idx_tickets_created_by (created_by),
  INDEX idx_tickets_due_date (due_date),
  INDEX idx_tickets_priority (priority),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_created_at (created_at),
  INDEX idx_tickets_updated_at (updated_at),
  INDEX idx_tickets_number (ticket_number),
  INDEX idx_tickets_parent (parent_ticket_id),
  INDEX idx_tickets_data_gin (data) USING GIN,
  INDEX idx_tickets_full_text (to_tsvector('arabic', title || ' ' || COALESCE(description, ''))) USING GIN
);

-- إنشاء رقم تذكرة تلقائي
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  process_prefix TEXT;
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  -- جلب بادئة العملية
  SELECT UPPER(LEFT(name, 3)) INTO process_prefix
  FROM processes WHERE id = NEW.process_id;
  
  -- سنة حالية
  year_suffix := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- رقم تسلسلي
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM tickets 
  WHERE ticket_number LIKE process_prefix || '-' || year_suffix || '-%';
  
  -- تكوين رقم التذكرة
  NEW.ticket_number := process_prefix || '-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();
```

### جدول أنشطة التذاكر (ticket_activities)
```sql
CREATE TABLE ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  field_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_activities_ticket (ticket_id),
  INDEX idx_activities_user (user_id),
  INDEX idx_activities_type (activity_type),
  INDEX idx_activities_created (created_at),
  INDEX idx_activities_ticket_created (ticket_id, created_at)
);

-- تحديث تلقائي لـ updated_at في جدول التذاكر
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET updated_at = NOW() 
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_timestamp
  AFTER INSERT ON ticket_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();
```

### جدول تعليقات التذاكر (ticket_comments)
```sql
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  mentions UUID[] DEFAULT '{}',
  parent_comment_id UUID REFERENCES ticket_comments(id),
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  INDEX idx_comments_ticket (ticket_id),
  INDEX idx_comments_user (user_id),
  INDEX idx_comments_created (created_at),
  INDEX idx_comments_parent (parent_comment_id)
);
```

### جدول مرفقات التذاكر (ticket_attachments)
```sql
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  INDEX idx_attachments_ticket (ticket_id),
  INDEX idx_attachments_uploaded_by (uploaded_by),
  INDEX idx_attachments_created (created_at),
  INDEX idx_attachments_mime_type (mime_type)
);
```

---

## جداول الأتمتة والتكرار

### جدول قواعد الأتمتة (automation_rules)
```sql
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  trigger_event VARCHAR(50) NOT NULL,
  trigger_conditions JSONB DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_automation_process (process_id),
  INDEX idx_automation_event (trigger_event),
  INDEX idx_automation_active (is_active),
  INDEX idx_automation_created_by (created_by)
);
```

### جدول سجل تنفيذ الأتمتة (automation_executions)
```sql
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  actions_executed JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_executions_rule (rule_id),
  INDEX idx_executions_ticket (ticket_id),
  INDEX idx_executions_status (status),
  INDEX idx_executions_executed (executed_at)
);
```

### جدول التذاكر المتكررة (recurring_rules)
```sql
CREATE TABLE recurring_rules (
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_recurring_process (process_id),
  INDEX idx_recurring_next_execution (next_execution),
  INDEX idx_recurring_active (is_active),
  INDEX idx_recurring_type (schedule_type)
);
```

---

## جداول التكاملات والإشعارات

### جدول التكاملات الخارجية (integrations)
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('webhook', 'rest_api', 'graphql', 'email')),
  endpoint TEXT NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  authentication JSONB DEFAULT '{}',
  trigger_events TEXT[] NOT NULL,
  payload_template JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  retry_policy JSONB DEFAULT '{"max_retries": 3, "retry_delay_seconds": 60}',
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_integrations_type (integration_type),
  INDEX idx_integrations_active (is_active),
  INDEX idx_integrations_events (trigger_events) USING GIN
);
```

### جدول سجل التكاملات (integration_logs)
```sql
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_integration_logs_integration (integration_id),
  INDEX idx_integration_logs_event (event_type),
  INDEX idx_integration_logs_status (response_status),
  INDEX idx_integration_logs_executed (executed_at)
);
```

### جدول الإشعارات (notifications)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_type (notification_type),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created (created_at),
  INDEX idx_notifications_user_unread (user_id, is_read, created_at)
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

---

## جداول التقارير والإحصائيات

### جدول إحصائيات يومية (daily_statistics)
```sql
CREATE TABLE daily_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  tickets_created INTEGER DEFAULT 0,
  tickets_completed INTEGER DEFAULT 0,
  tickets_moved INTEGER DEFAULT 0,
  average_completion_time_hours DECIMAL(8,2),
  overdue_tickets INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, process_id),
  INDEX idx_daily_stats_date (date),
  INDEX idx_daily_stats_process (process_id)
);

-- تحديث الإحصائيات تلقائياً
CREATE OR REPLACE FUNCTION update_daily_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_statistics (date, process_id, tickets_created)
  VALUES (CURRENT_DATE, NEW.process_id, 1)
  ON CONFLICT (date, process_id)
  DO UPDATE SET 
    tickets_created = daily_statistics.tickets_created + 1,
    created_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_stats_on_ticket_create
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_statistics();
```

### جدول سجل الأداء (performance_logs)
```sql
CREATE TABLE performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_performance_endpoint (endpoint),
  INDEX idx_performance_response_time (response_time_ms),
  INDEX idx_performance_status (status_code),
  INDEX idx_performance_created (created_at),
  INDEX idx_performance_user (user_id)
);
```

---

## جداول الأمان والتدقيق

### جدول سجل التدقيق (audit_logs)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_resource (resource_type, resource_id),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_success (success)
);

-- تسجيل تلقائي للتغييرات المهمة
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, 
    old_values, new_values, created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- تطبيق التدقيق على الجداول المهمة
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_processes AFTER INSERT OR UPDATE OR DELETE ON processes
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

### جدول جلسات المستخدمين (user_sessions)
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (token_hash),
  INDEX idx_sessions_active (is_active),
  INDEX idx_sessions_expires (expires_at)
);

-- تنظيف الجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR last_activity < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- جدولة تنظيف يومي
SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');
```

---

## Views والاستعلامات المحسنة

### View للتذاكر مع التفاصيل الكاملة
```sql
CREATE VIEW tickets_detailed AS
SELECT 
  t.*,
  p.name as process_name,
  p.color as process_color,
  s.name as current_stage_name,
  s.color as current_stage_color,
  s.order_index as stage_order,
  u_assigned.name as assigned_user_name,
  u_assigned.email as assigned_user_email,
  u_created.name as created_user_name,
  u_created.email as created_user_email,
  (
    SELECT COUNT(*) 
    FROM ticket_comments tc 
    WHERE tc.ticket_id = t.id AND tc.deleted_at IS NULL
  ) as comments_count,
  (
    SELECT COUNT(*) 
    FROM ticket_attachments ta 
    WHERE ta.ticket_id = t.id AND ta.deleted_at IS NULL
  ) as attachments_count,
  (
    SELECT COUNT(*) 
    FROM ticket_activities ta 
    WHERE ta.ticket_id = t.id
  ) as activities_count,
  CASE 
    WHEN t.due_date IS NOT NULL AND t.due_date < NOW() THEN TRUE
    ELSE FALSE
  END as is_overdue,
  CASE 
    WHEN t.due_date IS NOT NULL AND t.due_date BETWEEN NOW() AND NOW() + INTERVAL '2 days' THEN TRUE
    ELSE FALSE
  END as is_due_soon,
  EXTRACT(EPOCH FROM (NOW() - t.created_at))/3600 as age_hours
FROM tickets t
JOIN processes p ON t.process_id = p.id
JOIN stages s ON t.current_stage_id = s.id
LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
JOIN users u_created ON t.created_by = u_created.id
WHERE t.deleted_at IS NULL;
```

### View لإحصائيات العمليات
```sql
CREATE VIEW process_statistics AS
SELECT 
  p.id,
  p.name,
  p.color,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN s.is_final = TRUE THEN 1 END) as completed_tickets,
  COUNT(CASE WHEN t.due_date < NOW() THEN 1 END) as overdue_tickets,
  COUNT(CASE WHEN t.priority IN ('high', 'urgent') THEN 1 END) as high_priority_tickets,
  ROUND(
    COUNT(CASE WHEN s.is_final = TRUE THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(t.id), 0) * 100, 2
  ) as completion_rate,
  AVG(
    CASE WHEN t.completed_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/86400 
    END
  ) as avg_completion_days
FROM processes p
LEFT JOIN tickets t ON p.id = t.process_id AND t.deleted_at IS NULL
LEFT JOIN stages s ON t.current_stage_id = s.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.color;
```

---

## إجراءات الصيانة والتحسين

### تنظيف البيانات القديمة
```sql
-- حذف الأنشطة القديمة (أكثر من 5 سنوات)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ticket_activities 
  WHERE created_at < NOW() - INTERVAL '5 years';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO audit_logs (action, resource_type, description, created_at)
  VALUES ('CLEANUP', 'ticket_activities', 'تم حذف ' || deleted_count || ' نشاط قديم', NOW());
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- أرشفة التذاكر المكتملة القديمة
CREATE OR REPLACE FUNCTION archive_old_completed_tickets()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE tickets 
  SET status = 'archived', updated_at = NOW()
  WHERE status = 'completed' 
  AND completed_at < NOW() - INTERVAL '2 years'
  AND status != 'archived';
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

### فهارس محسنة للأداء
```sql
-- فهرس مركب للبحث السريع
CREATE INDEX CONCURRENTLY idx_tickets_search 
ON tickets USING GIN (
  to_tsvector('arabic', title || ' ' || COALESCE(description, ''))
);

-- فهرس للتذاكر النشطة حسب العملية والمرحلة
CREATE INDEX CONCURRENTLY idx_tickets_active_process_stage 
ON tickets (process_id, current_stage_id, created_at DESC) 
WHERE deleted_at IS NULL AND status = 'active';

-- فهرس للتذاكر المتأخرة
CREATE INDEX CONCURRENTLY idx_tickets_overdue 
ON tickets (due_date, priority) 
WHERE due_date < NOW() AND status = 'active';

-- فهرس للأنشطة الحديثة
CREATE INDEX CONCURRENTLY idx_activities_recent 
ON ticket_activities (created_at DESC, ticket_id) 
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## إعدادات الأمان المتقدمة

### تشفير البيانات الحساسة
```sql
-- تمكين تشفير البيانات الحساسة
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- دالة تشفير البيانات الحساسة
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(encrypt(data::bytea, 'encryption_key', 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;

-- دالة فك تشفير البيانات
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), 'encryption_key', 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql;
```

### سياسات الأمان المتقدمة
```sql
-- منع الوصول للبيانات المحذوفة
CREATE POLICY "Hide deleted records"
  ON tickets FOR ALL
  TO authenticated
  USING (deleted_at IS NULL);

-- تقييد الوصول حسب القسم
CREATE POLICY "Department access control"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    -- المستخدم في نفس القسم
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.department = (
        SELECT data->>'department' 
        FROM tickets t2 
        WHERE t2.id = tickets.id
      )
    ) OR
    -- له صلاحية عرض جميع الأقسام
    EXISTS (
      SELECT 1 FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = auth.uid()
      AND p.resource = 'tickets'
      AND p.action = 'view_all_departments'
    )
  );
```

هذا المخطط الشامل لقاعدة البيانات يوفر أساساً قوياً ومرناً لنظام إدارة العمليات مع التركيز على الأداء والأمان وقابلية التوسع.