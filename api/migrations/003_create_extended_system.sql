-- Migration: إنشاء الجداول المتبقية للنظام المتكامل
-- Created: 2025-09-16

-- جدول التكاملات الخارجية (integrations)
CREATE TABLE IF NOT EXISTS integrations (
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول التكاملات
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_events ON integrations USING GIN(trigger_events);

-- جدول سجل التكاملات (integration_logs)
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول سجل التكاملات
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_event ON integration_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_executed ON integration_logs(executed_at);

-- جدول الإشعارات (notifications)
CREATE TABLE IF NOT EXISTS notifications (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول الإشعارات
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);

-- جدول إحصائيات يومية (daily_statistics)
CREATE TABLE IF NOT EXISTS daily_statistics (
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
  
  CONSTRAINT unique_daily_stats UNIQUE(date, process_id)
);

-- فهارس جدول الإحصائيات اليومية
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_statistics(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_process ON daily_statistics(process_id);

-- جدول سجل الأداء (performance_logs)
CREATE TABLE IF NOT EXISTS performance_logs (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول سجل الأداء
CREATE INDEX IF NOT EXISTS idx_performance_endpoint ON performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_response_time ON performance_logs(response_time_ms);
CREATE INDEX IF NOT EXISTS idx_performance_status ON performance_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_performance_created ON performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_user ON performance_logs(user_id);

-- جدول سجل التدقيق (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول سجل التدقيق
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_success ON audit_logs(success);

-- جدول جلسات المستخدمين (user_sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس جدول جلسات المستخدمين
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- إنشاء Views للاستعلامات المحسنة

-- View للتذاكر مع التفاصيل الكاملة
CREATE OR REPLACE VIEW tickets_detailed AS
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
    WHERE tc.ticket_id = t.id
  ) as comments_count,
  (
    SELECT COUNT(*)
    FROM ticket_attachments ta
    WHERE ta.ticket_id = t.id
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
JOIN users u_created ON t.created_by = u_created.id;

-- View لإحصائيات العمليات
CREATE OR REPLACE VIEW process_statistics AS
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
LEFT JOIN tickets t ON p.id = t.process_id
LEFT JOIN stages s ON t.current_stage_id = s.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.color;

-- الدوال والإجراءات المساعدة

-- دالة تحديث الإحصائيات اليومية
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

-- Trigger لتحديث الإحصائيات عند إنشاء تذكرة
CREATE TRIGGER trigger_update_daily_stats_on_ticket_create
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_statistics();

-- دالة تنظيف الجلسات المنتهية الصلاحية
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

-- دالة تنظيف الأنشطة القديمة
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ticket_activities
  WHERE created_at < NOW() - INTERVAL '5 years';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  INSERT INTO audit_logs (action, resource_type, new_values, created_at)
  VALUES ('CLEANUP', 'ticket_activities',
    jsonb_build_object('deleted_count', deleted_count), NOW());

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- دالة أرشفة التذاكر المكتملة القديمة
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

-- دالة تحديث timestamp للتذاكر
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث timestamp التذاكر
CREATE TRIGGER trigger_update_ticket_timestamp
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- فهارس محسنة للأداء

-- فهرس مركب للبحث السريع في التذاكر
CREATE INDEX IF NOT EXISTS idx_tickets_search
ON tickets USING GIN (
  to_tsvector('arabic', title || ' ' || COALESCE(description, ''))
);

-- فهرس للتذاكر النشطة حسب العملية والمرحلة
CREATE INDEX IF NOT EXISTS idx_tickets_active_process_stage
ON tickets (process_id, current_stage_id, created_at DESC)
WHERE status = 'active';

-- فهرس للتذاكر المتأخرة
CREATE INDEX IF NOT EXISTS idx_tickets_overdue
ON tickets (due_date, priority)
WHERE status = 'active';

-- فهرس مركب للإشعارات غير المقروءة
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user
ON notifications (user_id, created_at DESC)
WHERE is_read = FALSE;

-- فهرس للبحث في البيانات المخصصة للتذاكر
CREATE INDEX IF NOT EXISTS idx_tickets_data_gin
ON tickets USING GIN (data);

-- فهرس للعلامات (tags)
CREATE INDEX IF NOT EXISTS idx_tickets_tags_gin
ON tickets USING GIN (tags);

-- فهرس مركب للأداء والإحصائيات
CREATE INDEX IF NOT EXISTS idx_performance_endpoint_time
ON performance_logs (endpoint, created_at DESC, response_time_ms);

-- فهرس للتكاملات النشطة
CREATE INDEX IF NOT EXISTS idx_integrations_active_type
ON integrations (is_active, integration_type)
WHERE is_active = TRUE;
