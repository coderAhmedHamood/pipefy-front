-- Migration: إضافة عمود data إلى جدول recurring_rules
-- تاريخ الإنشاء: 2026-01-05

-- التحقق من وجود العمود وإضافته إذا لم يكن موجوداً
DO $$
BEGIN
    -- التحقق من وجود عمود data
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_rules' 
        AND column_name = 'data'
    ) THEN
        -- إضافة عمود data
        ALTER TABLE recurring_rules 
        ADD COLUMN data JSONB DEFAULT '{}';
        
        RAISE NOTICE '✅ تم إضافة عمود data إلى جدول recurring_rules';
    ELSE
        RAISE NOTICE 'ℹ️  عمود data موجود بالفعل في جدول recurring_rules';
    END IF;
END $$;

-- التحقق من وجود عمود title
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_rules' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE recurring_rules 
        ADD COLUMN title VARCHAR(500);
        
        RAISE NOTICE '✅ تم إضافة عمود title إلى جدول recurring_rules';
    ELSE
        RAISE NOTICE 'ℹ️  عمود title موجود بالفعل في جدول recurring_rules';
    END IF;
END $$;

-- التحقق من وجود عمود recurrence_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_rules' 
        AND column_name = 'recurrence_type'
    ) THEN
        ALTER TABLE recurring_rules 
        ADD COLUMN recurrence_type VARCHAR(50) DEFAULT 'daily' 
        CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly'));
        
        RAISE NOTICE '✅ تم إضافة عمود recurrence_type إلى جدول recurring_rules';
    ELSE
        RAISE NOTICE 'ℹ️  عمود recurrence_type موجود بالفعل في جدول recurring_rules';
    END IF;
END $$;

-- التحقق من وجود عمود recurrence_interval
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_rules' 
        AND column_name = 'recurrence_interval'
    ) THEN
        ALTER TABLE recurring_rules 
        ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
        
        RAISE NOTICE '✅ تم إضافة عمود recurrence_interval إلى جدول recurring_rules';
    ELSE
        RAISE NOTICE 'ℹ️  عمود recurrence_interval موجود بالفعل في جدول recurring_rules';
    END IF;
END $$;

-- التحقق من وجود عمود month_day
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_rules' 
        AND column_name = 'month_day'
    ) THEN
        ALTER TABLE recurring_rules 
        ADD COLUMN month_day INTEGER;
        
        RAISE NOTICE '✅ تم إضافة عمود month_day إلى جدول recurring_rules';
    ELSE
        RAISE NOTICE 'ℹ️  عمود month_day موجود بالفعل في جدول recurring_rules';
    END IF;
END $$;

-- التحقق من وجود عمود weekdays
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_rules' 
        AND column_name = 'weekdays'
    ) THEN
        ALTER TABLE recurring_rules 
        ADD COLUMN weekdays INTEGER[];
        
        RAISE NOTICE '✅ تم إضافة عمود weekdays إلى جدول recurring_rules';
    ELSE
        RAISE NOTICE 'ℹ️  عمود weekdays موجود بالفعل في جدول recurring_rules';
    END IF;
END $$;

