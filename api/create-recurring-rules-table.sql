-- إنشاء جدول قواعد التكرار (recurring_rules)
-- تاريخ الإنشاء: 2025-10-29
-- الوصف: جدول لحفظ قواعد التكرار للتذاكر

-- حذف الجدول إذا كان موجوداً (احتياطي)
DROP TABLE IF EXISTS recurring_rules CASCADE;

-- إنشاء الجدول الجديد
CREATE TABLE recurring_rules (
    -- معرف فريد للقاعدة
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- معلومات أساسية للقاعدة
    name VARCHAR(500) NOT NULL,                    -- اسم القاعدة (مطلوب)
    rule_name VARCHAR(500),                        -- اسم القاعدة البديل
    rule_description TEXT,                         -- وصف القاعدة
    description TEXT,                              -- وصف إضافي
    
    -- معلومات التذكرة المتكررة
    title VARCHAR(500) NOT NULL,                   -- عنوان التذكرة
    process_id UUID NOT NULL,                      -- معرف العملية
    current_stage_id UUID,                         -- معرف المرحلة الحالية
    assigned_to UUID,                              -- المُسند إليه
    created_by UUID NOT NULL,                      -- منشئ القاعدة
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
    due_date TIMESTAMPTZ,                          -- تاريخ الاستحقاق
    data JSONB DEFAULT '{}',                       -- بيانات إضافية
    tags TEXT[] DEFAULT '{}',                      -- العلامات
    
    -- معلومات إضافية
    process_name VARCHAR(500),                     -- اسم العملية
    stage_name VARCHAR(500),                       -- اسم المرحلة
    created_by_name VARCHAR(500),                  -- اسم المنشئ
    assigned_to_name VARCHAR(500),                 -- اسم المُسند إليه
    assigned_to_id UUID,                           -- معرف المُسند إليه
    
    -- إعدادات التكرار
    recurrence_type VARCHAR(50) NOT NULL DEFAULT 'daily' CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    recurrence_count INTEGER DEFAULT 1 CHECK (recurrence_count > 0),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    next_execution_date TIMESTAMPTZ,
    last_execution_date TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    
    -- إعدادات التكرار المتقدمة
    recurrence_interval INTEGER DEFAULT 1,
    weekdays INTEGER[],                            -- أيام الأسبوع (1-7)
    month_day INTEGER,                             -- يوم الشهر (1-31)
    custom_pattern JSONB DEFAULT '{}',             -- نمط مخصص
    
    -- حالة القاعدة
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    
    -- تواريخ النظام
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- قيود المرجعية
    CONSTRAINT fk_recurring_rules_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_rules_stage FOREIGN KEY (current_stage_id) REFERENCES stages(id) ON DELETE SET NULL,
    CONSTRAINT fk_recurring_rules_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_rules_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_recurring_rules_assignee_id FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_recurring_rules_active ON recurring_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next_exec ON recurring_rules(next_execution_date);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_process ON recurring_rules(process_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_type ON recurring_rules(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_created_by ON recurring_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_created_at ON recurring_rules(created_at);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_name ON recurring_rules(name);

-- إضافة تعليقات للتوضيح
COMMENT ON TABLE recurring_rules IS 'جدول قواعد التكرار للتذاكر';
COMMENT ON COLUMN recurring_rules.id IS 'معرف فريد للقاعدة';
COMMENT ON COLUMN recurring_rules.name IS 'اسم القاعدة (مطلوب)';
COMMENT ON COLUMN recurring_rules.rule_name IS 'اسم القاعدة البديل';
COMMENT ON COLUMN recurring_rules.title IS 'عنوان التذكرة المتكررة';
COMMENT ON COLUMN recurring_rules.recurrence_type IS 'نوع التكرار: daily, weekly, monthly, yearly';
COMMENT ON COLUMN recurring_rules.is_active IS 'حالة تفعيل القاعدة';
COMMENT ON COLUMN recurring_rules.next_execution_date IS 'تاريخ التنفيذ التالي';

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_recurring_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_rules_updated_at
    BEFORE UPDATE ON recurring_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_rules_updated_at();

-- إدراج بيانات اختبار (اختياري)
-- INSERT INTO recurring_rules (name, title, process_id, created_by, recurrence_type) 
-- VALUES ('قاعدة اختبار', 'تذكرة اختبار', 'process-uuid', 'user-uuid', 'daily');
