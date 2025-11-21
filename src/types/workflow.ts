// أنواع البيانات الأساسية للنظام
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  created_at: string;
  is_active: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  process_id?: string; // معرف العملية المرتبطة بالصلاحية (اختياري للتوافق مع الصلاحيات العامة)
}

export interface Process {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  stages: Stage[];
  fields: ProcessField[];
  created_by: string;
  created_at: string;
  is_active: boolean;
  settings: ProcessSettings;
}

export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  priority: number;
  description?: string;
  fields: StageField[];
  transition_rules: TransitionRule[];
  automation_rules: AutomationRule[];
  required_permissions?: string[];
  allowed_transitions: string[];
  sla_hours?: number;
  is_initial?: boolean;
  is_final?: boolean;
}

export interface ProcessField {
  id: string;
  name: string;
  type: FieldType;
  is_required: boolean;
  is_system_field: boolean;
  options?: FieldOption[];
  validation_rules?: ValidationRule[];
  default_value?: any;
}

export interface StageField extends ProcessField {
  stage_id: string;
  is_editable: boolean;
  is_visible: boolean;
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'datetime' 
  | 'select' 
  | 'multiselect' 
  | 'textarea' 
  | 'file' 
  | 'checkbox' 
  | 'radio'
  | 'ticket_reviewer';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  color?: string;
}

export interface TransitionRule {
  id: string;
  from_stage_id: string;
  to_stage_id: string;
  conditions?: Condition[];
  required_permissions?: string[];
  is_automatic?: boolean;
  is_default?: boolean;
  transition_type: 'single' | 'multiple';
  display_name?: string;
  confirmation_required?: boolean;
}

export interface Condition {
  field_id: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions?: Condition[];
  actions: AutomationAction[];
  is_active: boolean;
}

export interface AutomationTrigger {
  event: 'stage_changed' | 'field_updated' | 'due_date_approaching' | 'overdue' | 'created' | 'assigned' | 'completed';
  stage_id?: string;
  field_id?: string;
  conditions?: Condition[];
}

export interface AutomationAction {
  type: 'send_notification' | 'update_field' | 'move_to_stage' | 'create_ticket' | 'send_email' | 'assign_user' | 'add_comment';
  parameters: Record<string, any>;
  delay_minutes?: number;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  process_id: string;
  current_stage_id: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  completed_at?: string;
  status?: string;
  priority: Priority;
  data: Record<string, any>;
  attachments: Attachment[];
  activities: Activity[];
  tags: Tag[];
  parent_ticket_id?: string;
  child_tickets: string[];
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Activity {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  type: ActivityType;
  description: string;
  created_at: string;
  data?: Record<string, any>;
  old_value?: any;
  new_value?: any;
  field_name?: string;
}

export type ActivityType = 
  | 'created' 
  | 'updated' 
  | 'stage_changed' 
  | 'assigned' 
  | 'comment_added' 
  | 'attachment_added' 
  | 'due_date_changed'
  | 'automated_action'
  | 'priority_changed'
  | 'field_updated'
  | 'reviewer_assigned'
  | 'reviewer_changed'
  | 'title_changed'
  | 'description_changed'
  | 'completed';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ProcessSettings {
  auto_assign: boolean;
  due_date_required: boolean;
  allow_self_assignment: boolean;
  default_priority: Priority;
  notification_settings: NotificationSettings;
}

export interface NotificationSettings {
  email_notifications: boolean;
  in_app_notifications: boolean;
  notify_on_assignment: boolean;
  notify_on_stage_change: boolean;
  notify_on_due_date: boolean;
  notify_on_overdue: boolean;
}

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'min_value' | 'max_value';
  value?: any;
  message: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: LayoutConfig;
  filters: DashboardFilter[];
  is_default: boolean;
  created_by: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; width: number; height: number };
}

export type WidgetType = 
  | 'tickets_count' 
  | 'tickets_by_stage' 
  | 'tickets_by_priority' 
  | 'overdue_tickets' 
  | 'performance_chart' 
  | 'recent_activities';

export interface WidgetConfig {
  process_id?: string;
  stage_id?: string;
  user_id?: string;
  date_range?: DateRange;
  chart_type?: 'bar' | 'pie' | 'line' | 'area';
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'process' | 'stage' | 'user' | 'date_range' | 'priority';
  values: any[];
}

export interface LayoutConfig {
  columns: number;
  row_height: number;
  margin: [number, number];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export type NotificationType = 
  | 'ticket_assigned' 
  | 'stage_changed' 
  | 'due_date_approaching' 
  | 'overdue' 
  | 'comment_added' 
  | 'system_alert';

// إضافة أنواع جديدة للأتمتة والتكرار
export interface RecurringRule {
  id: string;
  name: string;
  process_id: string;
  template_data: Partial<Ticket>;
  schedule: RecurringSchedule;
  is_active: boolean;
  created_by: string;
  created_at: string;
  last_executed?: string;
  next_execution: string;
}

export interface RecurringSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  days_of_week?: number[]; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  time: string; // HH:MM format
  end_date?: string;
}

export interface TicketConnection {
  id: string;
  parent_ticket_id: string;
  child_ticket_id: string;
  connection_type: 'blocks' | 'depends_on' | 'relates_to' | 'duplicates';
  created_at: string;
  created_by: string;
}

export interface SystemSettings {
  company_name: string;
  company_logo?: string;
  primary_color: string;
  secondary_color: string;
  language: string;
  timezone: string;
  date_format: string;
  working_hours: {
    start: string;
    end: string;
  };
  working_days: string[];
  email_settings: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
  };
  notification_settings: {
    email_enabled: boolean;
    in_app_enabled: boolean;
    sms_enabled: boolean;
  };
}

export interface ApiIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'rest_api' | 'graphql';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth';
    credentials: Record<string, string>;
  };
  trigger_events: string[];
  is_active: boolean;
  created_at: string;
}
}