-- Migration: 004_modify_stage_name_constraint.sql
-- تعديل قيود أسماء المراحل للسماح بالتكرار في مستويات هرمية مختلفة

-- إضافة عمود parent_stage_id إذا لم يكن موجود
ALTER TABLE stages 
ADD COLUMN IF NOT EXISTS parent_stage_id UUID REFERENCES stages(id) ON DELETE CASCADE;

-- إزالة القيد الفريد على (process_id, name) إذا كان موجود
DO $$ 
BEGIN
    -- البحث عن القيد الفريد على (process_id, name)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname LIKE '%stages%name%' 
        OR conname LIKE '%unique%process%name%'
        OR (conrelid = (SELECT oid FROM pg_class WHERE relname = 'stages')
            AND contype = 'u' 
            AND array_length(conkey, 1) = 2)
    ) THEN
        -- محاولة إزالة القيود المحتملة
        BEGIN
            ALTER TABLE stages DROP CONSTRAINT IF EXISTS unique_process_stage_name;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- تجاهل الخطأ إذا لم يكن القيد موجود
        END;
        
        BEGIN
            ALTER TABLE stages DROP CONSTRAINT IF EXISTS stages_process_id_name_key;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        
        BEGIN
            ALTER TABLE stages DROP CONSTRAINT IF EXISTS stages_name_process_id_key;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
END $$;

-- إنشاء فهرس للأداء على parent_stage_id
CREATE INDEX IF NOT EXISTS idx_stages_parent ON stages(parent_stage_id);

-- إنشاء فهرس مركب للبحث الهرمي
CREATE INDEX IF NOT EXISTS idx_stages_hierarchy ON stages(process_id, parent_stage_id, name);

-- إضافة تعليق للتوضيح
COMMENT ON COLUMN stages.parent_stage_id IS 'معرف المرحلة الأب للمراحل الفرعية - يسمح بالتسلسل الهرمي';

-- تحديث الجدول لدعم البحث الهرمي
-- (لا نحتاج لقيد فريد صارم لأن التحقق يتم في التطبيق)

-- إنشاء دالة للتحقق من التسلسل الهرمي (منع الحلقات المفرغة)
CREATE OR REPLACE FUNCTION check_stage_hierarchy_cycle(stage_id UUID, parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_parent UUID;
    max_depth INTEGER := 10; -- حد أقصى للعمق لمنع الحلقات اللانهائية
    depth INTEGER := 0;
BEGIN
    -- إذا كان parent_id فارغ، فلا توجد مشكلة
    IF parent_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- إذا كان stage_id يساوي parent_id، فهذه حلقة مباشرة
    IF stage_id = parent_id THEN
        RETURN TRUE;
    END IF;
    
    -- تتبع السلسلة الهرمية للأعلى
    current_parent := parent_id;
    
    WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
        -- إذا وصلنا إلى stage_id، فهناك حلقة
        IF current_parent = stage_id THEN
            RETURN TRUE;
        END IF;
        
        -- الانتقال إلى المستوى الأعلى
        SELECT parent_stage_id INTO current_parent 
        FROM stages 
        WHERE id = current_parent;
        
        depth := depth + 1;
    END LOOP;
    
    -- لا توجد حلقة
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- إضافة قيد للتحقق من عدم وجود حلقات في التسلسل الهرمي
ALTER TABLE stages 
ADD CONSTRAINT check_no_hierarchy_cycle 
CHECK (NOT check_stage_hierarchy_cycle(id, parent_stage_id));

COMMENT ON CONSTRAINT check_no_hierarchy_cycle ON stages IS 'منع إنشاء حلقات في التسلسل الهرمي للمراحل';
