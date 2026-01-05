const { pool } = require('../config/database');

class RecurringController {
  // جلب جميع قواعد التكرار
  static async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        process_id, 
        is_active,
        schedule_type 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (process_id) {
        paramCount++;
        query += ` AND rr.process_id = $${paramCount}`;
        params.push(process_id);
      }
      
      if (is_active !== undefined) {
        paramCount++;
        query += ` AND rr.is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }
      
      if (schedule_type) {
        paramCount++;
        query += ` AND (rr.schedule_type = $${paramCount} OR rr.recurrence_type = $${paramCount})`;
        params.push(schedule_type);
      }
      
      // إضافة ORDER BY و LIMIT/OFFSET
      query += ` 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      // محاولة استخدام next_execution في ORDER BY
      let result;
      try {
        const queryWithOrder = query.replace('LIMIT', 'ORDER BY rr.next_execution ASC NULLS LAST LIMIT');
        result = await pool.query(queryWithOrder, params);
      } catch (error) {
        // إذا فشل، استخدم next_execution_date أو created_at
        if (error.message && error.message.includes('next_execution')) {
          try {
            const queryWithOrder = query.replace('LIMIT', 'ORDER BY rr.next_execution_date ASC NULLS LAST LIMIT');
            result = await pool.query(queryWithOrder, params);
          } catch (error2) {
            // إذا فشل أيضاً، استخدم created_at
            const queryWithOrder = query.replace('LIMIT', 'ORDER BY rr.created_at DESC LIMIT');
            result = await pool.query(queryWithOrder, params);
          }
        } else {
          throw error;
        }
      }
      
      const rules = result.rows.map(formatRecurringRule);
      
      // عدد إجمالي السجلات - استخدام parameterized queries
      let countQuery = `
        SELECT COUNT(*) as total
        FROM recurring_rules rr
        WHERE 1=1
      `;
      const countParams = [];
      let countParamCount = 0;
      
      if (process_id) {
        countParamCount++;
        countQuery += ` AND rr.process_id = $${countParamCount}`;
        countParams.push(process_id);
      }
      
      if (is_active !== undefined) {
        countParamCount++;
        countQuery += ` AND rr.is_active = $${countParamCount}`;
        countParams.push(is_active === 'true');
      }
      
      if (schedule_type) {
        countParamCount++;
        countQuery += ` AND (rr.schedule_type = $${countParamCount} OR rr.recurrence_type = $${countParamCount})`;
        countParams.push(schedule_type);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      res.json({
        success: true,
        data: rules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('خطأ في جلب قواعد التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قواعد التكرار',
        error: error.message
      });
    }
  }
  
  // جلب قاعدة تكرار واحدة
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      res.json({
        success: true,
        data: formatRecurringRule(result.rows[0])
      });
    } catch (error) {
      console.error('خطأ في جلب قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قاعدة التكرار',
        error: error.message
      });
    }
  }
  
  // إنشاء قاعدة تكرار جديدة
  static async create(req, res) {
    try {
      const {
        name,
        description,
        template_data,
        process_id,
        schedule_type = 'daily',
        schedule_config = {},
        timezone = 'Asia/Riyadh',
        is_active = true,
        next_execution,
        start_date,  // تاريخ بداية التنفيذ
        assigned_to,
        priority = 'medium',
        status = 'active',
        max_executions = null,
        data  // ✅ استخراج data من req.body مباشرة
      } = req.body;
      
      // التأكد من وجود الحقول المطلوبة
      if (!name || !process_id) {
        return res.status(400).json({
          success: false,
          message: 'الحقول name و process_id مطلوبة'
        });
      }

      // التأكد من وجود المستخدم
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول لإنشاء قاعدة تكرار'
        });
      }

      const scheduleConfigObject = typeof schedule_config === 'string'
        ? safeParseJSON(schedule_config, {})
        : (schedule_config || {});

      // معالجة template_data - السماح بقيم افتراضية إذا لم يتم إرسالها
      let templateDataObject = {};
      if (template_data !== undefined && template_data !== null) {
        if (typeof template_data === 'string') {
          templateDataObject = safeParseJSON(template_data, {});
        } else if (typeof template_data === 'object') {
          templateDataObject = template_data;
        }
      }
      
      // إذا كان template_data فارغاً، استخدم name كعنوان افتراضي
      if (!templateDataObject.title && !templateDataObject.data) {
        templateDataObject = {
          title: name,
          description: description || '',
          priority: priority || 'medium',
          data: {}
        };
      }

      // استخراج title من template_data
      const title = templateDataObject.title || name;
      
      // ✅ استخراج data من req.body مباشرة (الأولوية: req.body.data > template_data.data > {})
      let finalData = data !== undefined ? data : (templateDataObject.data || {});
      
      // معالجة data إذا كان string
      if (typeof finalData === 'string') {
        try {
          finalData = JSON.parse(finalData);
        } catch (e) {
          console.warn('⚠️  فشل parse لـ data:', e);
          finalData = {};
        }
      }
      
      // التأكد من أن finalData كائن
      if (typeof finalData !== 'object' || finalData === null || Array.isArray(finalData)) {
        console.warn('⚠️  data ليس كائناً، سيتم استخدام كائن فارغ');
        finalData = {};
      }
      
      console.log('📥 بيانات قاعدة التكرار المستقبلة:', {
        name,
        process_id,
        title,
        data_keys: Object.keys(finalData),
        data_count: Object.keys(finalData).length,
        data: finalData
      });

      // حساب next_execution_date
      // الأولوية: start_date > next_execution > حساب تلقائي
      let nextExecutionDate;
      let startDateValue;

      if (start_date) {
        // إذا تم إرسال start_date، استخدمه كتاريخ بداية التنفيذ
        startDateValue = new Date(start_date);
        nextExecutionDate = startDateValue;
        
        // التحقق من صحة start_date
        if (isNaN(startDateValue.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'تاريخ بداية التنفيذ (start_date) غير صحيح'
          });
        }
      } else if (next_execution) {
        // إذا تم إرسال next_execution فقط، استخدمه
        nextExecutionDate = new Date(next_execution);
        startDateValue = nextExecutionDate;
        
        // التحقق من صحة next_execution
        if (isNaN(nextExecutionDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'تاريخ التنفيذ التالي (next_execution) غير صحيح'
          });
        }
      } else {
        // إذا لم يتم إرسال أي منهما، احسب تلقائياً
        // تحديد interval بناءً على schedule_type
        if (!scheduleConfigObject.interval) {
          if (schedule_type === 'minutes') {
            // للدقائق فقط: نستخدم recurring_worker_interval من الإعدادات
            try {
              const Settings = require('../models/Settings');
              const settings = await Settings.getSettings();
              scheduleConfigObject.interval = settings.recurring_worker_interval || 1; // بالدقائق
            } catch (error) {
              console.warn('⚠️  تحذير: فشل جلب إعدادات recurring_worker_interval، سيتم استخدام 1 دقيقة');
              scheduleConfigObject.interval = 1; // افتراضي: 1 دقيقة
            }
          } else {
            // للأنواع الأخرى (daily, weekly, monthly, yearly): نستخدم 1 كافتراضي
            scheduleConfigObject.interval = 1;
          }
        }
        nextExecutionDate = calculateNextExecution(schedule_type, scheduleConfigObject, timezone);
        startDateValue = new Date(); // تاريخ الآن كتاريخ بداية
      }

      // التحقق النهائي من صحة next_execution_date
      if (isNaN(nextExecutionDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ التنفيذ التالي غير صحيح'
        });
      }

      // تحويل schedule_type إلى recurrence_type
      const recurrenceType = schedule_type === 'custom' ? 'daily' : schedule_type;
      
      // استخراج recurrence_interval من schedule_config
      const recurrenceInterval = scheduleConfigObject.interval || 1;
      
      // استخراج month_day من schedule_config
      const monthDay = scheduleConfigObject.day_of_month || null;
      
      // استخراج weekdays من schedule_config
      const weekdays = scheduleConfigObject.days_of_week || [];

      // محاولة الإدراج مع البنية الجديدة أولاً
      let result;
      try {
        // ✅ إعداد template_data للتوافق مع البنية القديمة
        const templateDataForDB = {
          title: title,
          description: description || '',
          priority: priority,
          data: finalData
        };
        
        result = await pool.query(`
          INSERT INTO recurring_rules (
            name,
            description,
            process_id,
            title,
            data,
            template_data,
            schedule_type,
            schedule_config,
            recurrence_type,
            recurrence_interval,
            month_day,
            weekdays,
            next_execution,
            next_execution_date,
            start_date,
            is_active,
            created_by,
            assigned_to,
            priority,
            status,
            max_executions
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING *
        `, [
          name,
          description || null,
          process_id,
          title,
          finalData,  // ✅ JSONB في عمود data
          JSON.stringify(templateDataForDB),  // ✅ template_data للتوافق
          schedule_type,  // ✅ schedule_type
          JSON.stringify(scheduleConfigObject),  // ✅ schedule_config
          recurrenceType,
          recurrenceInterval,
          monthDay,
          weekdays,
          nextExecutionDate,  // ✅ next_execution
          nextExecutionDate,  // ✅ next_execution_date
          startDateValue,
          is_active,
          req.user.id,
          assigned_to || null,
          priority,
          status,
          max_executions || null
        ]);
        
        // ✅ التحقق من البيانات المحفوظة
        const savedData = result.rows[0]?.data;
        let parsedSavedData = savedData;
        if (typeof savedData === 'string') {
          try {
            parsedSavedData = JSON.parse(savedData);
          } catch (e) {
            parsedSavedData = savedData;
          }
        }
        
        console.log('✅ تم حفظ قاعدة التكرار:', {
          id: result.rows[0]?.id?.substring(0, 8),
          name: result.rows[0]?.name,
          data_type: typeof savedData,
          data_keys: parsedSavedData && typeof parsedSavedData === 'object' ? Object.keys(parsedSavedData) : [],
          data_count: parsedSavedData && typeof parsedSavedData === 'object' ? Object.keys(parsedSavedData).length : 0
        });
      } catch (error) {
        // إذا فشل، جرب البنية القديمة (schedule_type, template_data, etc.)
        console.error('❌ فشل INSERT مع البنية الجديدة:', {
          error_message: error.message,
          error_code: error.code,
          error_detail: error.detail,
          error_hint: error.hint
        });
        
        if (error.message && (error.message.includes('recurrence_type') || error.message.includes('column'))) {
          result = await pool.query(`
            INSERT INTO recurring_rules (
              name,
              description,
              process_id,
              template_data,
              schedule_type,
              schedule_config,
              timezone,
              is_active,
              next_execution,
              created_by,
              max_executions
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `, [
            name,
            description || null,
            process_id,
            templateDataObject,
            schedule_type,
            scheduleConfigObject,
            timezone,
            is_active,
            nextExecutionDate,
            req.user.id,
            max_executions || null
          ]);
          
          console.warn('⚠️  تم استخدام البنية القديمة (بدون عمود data):', {
            id: result.rows[0]?.id?.substring(0, 8),
            name: result.rows[0]?.name
          });
        } else {
          throw error;
        }
      }
      
      const rule = formatRecurringRule(result.rows[0]);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء قاعدة التكرار بنجاح',
        data: rule
      });
    } catch (error) {
      console.error('خطأ في إنشاء قاعدة التكرار:', error);
      console.error('تفاصيل الخطأ:', {
        message: error.message,
        detail: error.detail,
        code: error.code,
        constraint: error.constraint,
        stack: error.stack
      });
      
      // معالجة أخطاء قاعدة البيانات بشكل أفضل
      let errorMessage = 'خطأ في إنشاء قاعدة التكرار';
      if (error.code === '23503') { // Foreign key violation
        if (error.constraint?.includes('process_id')) {
          errorMessage = 'العملية المحددة غير موجودة';
        } else if (error.constraint?.includes('created_by')) {
          errorMessage = 'المستخدم غير موجود';
        } else {
          errorMessage = 'مرجع غير صحيح في البيانات';
        }
      } else if (error.code === '23502') { // Not null violation
        errorMessage = 'حقل مطلوب مفقود: ' + (error.column || 'غير محدد');
      } else if (error.code === '23505') { // Unique violation
        errorMessage = 'قاعدة تكرار بهذا الاسم موجودة بالفعل';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message,
        detail: process.env.NODE_ENV === 'development' ? error.detail : undefined,
        code: process.env.NODE_ENV === 'development' ? error.code : undefined
      });
    }
  }
  
  // تحديث قاعدة تكرار
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        template_data,
        process_id,
        schedule_type,
        schedule_config,
        timezone,
        is_active,
        next_execution,
        assigned_to,
        priority,
        status,
        data,
        title,
        max_executions
      } = req.body;
      
      // التحقق من وجود القاعدة أولاً
      const existingResult = await pool.query(
        'SELECT * FROM recurring_rules WHERE id = $1',
        [id]
      );
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      const existingRule = existingResult.rows[0];
      
      // بناء استعلام UPDATE ديناميكي
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;
      
      // تحديث name
      if (name !== undefined) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        updateValues.push(name);
      }
      
      // تحديث description
      if (description !== undefined) {
        paramCount++;
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(description);
      }
      
      // تحديث process_id
      if (process_id !== undefined) {
        paramCount++;
        updateFields.push(`process_id = $${paramCount}`);
        updateValues.push(process_id);
      }
      
      // معالجة template_data - تحويله إلى title و data
      if (template_data !== undefined) {
        const templateDataObject = typeof template_data === 'string'
          ? safeParseJSON(template_data, {})
          : template_data;
        
        if (templateDataObject.title !== undefined) {
          paramCount++;
          updateFields.push(`title = $${paramCount}`);
          updateValues.push(templateDataObject.title);
        }
        
        if (templateDataObject.data !== undefined) {
          paramCount++;
          updateFields.push(`data = $${paramCount}`);
          updateValues.push(templateDataObject.data);
        } else if (Object.keys(templateDataObject).length > 0 && !templateDataObject.title) {
          // إذا كان template_data كائن بدون title، استخدمه كـ data
          paramCount++;
          updateFields.push(`data = $${paramCount}`);
          updateValues.push(templateDataObject);
        }
      }
      
      // معالجة schedule_type و schedule_config
      if (schedule_type !== undefined) {
        const recurrenceType = schedule_type === 'custom' ? 'daily' : schedule_type;
        paramCount++;
        updateFields.push(`recurrence_type = $${paramCount}`);
        updateValues.push(recurrenceType);
      }
      
      if (schedule_config !== undefined) {
        const scheduleConfigObject = typeof schedule_config === 'string'
          ? safeParseJSON(schedule_config, {})
          : schedule_config;
        
        if (scheduleConfigObject.interval !== undefined) {
          paramCount++;
          updateFields.push(`recurrence_interval = $${paramCount}`);
          updateValues.push(scheduleConfigObject.interval);
        }
        
        if (scheduleConfigObject.day_of_month !== undefined) {
          paramCount++;
          updateFields.push(`month_day = $${paramCount}`);
          updateValues.push(scheduleConfigObject.day_of_month);
        }
        
        if (scheduleConfigObject.days_of_week !== undefined) {
          paramCount++;
          updateFields.push(`weekdays = $${paramCount}`);
          updateValues.push(scheduleConfigObject.days_of_week);
        }
      }
      
      // تحديث next_execution_date
      if (next_execution !== undefined || schedule_type !== undefined || schedule_config !== undefined) {
        let nextExecutionDate;
        
        if (next_execution !== undefined) {
          nextExecutionDate = new Date(next_execution);
        } else {
          // حساب next_execution_date من schedule_type و schedule_config
          const scheduleType = schedule_type || existingRule.recurrence_type || existingRule.schedule_type || 'daily';
          let scheduleConfig = {};
          
          if (schedule_config !== undefined) {
            scheduleConfig = typeof schedule_config === 'string'
              ? safeParseJSON(schedule_config, {})
              : schedule_config;
          } else {
            scheduleConfig = {
              interval: existingRule.recurrence_interval || 1,
              day_of_month: existingRule.month_day,
              days_of_week: existingRule.weekdays || []
            };
          }
          
          nextExecutionDate = calculateNextExecution(
            scheduleType,
            scheduleConfig,
            timezone || existingRule.timezone || 'Asia/Riyadh'
          );
        }
        
        paramCount++;
        updateFields.push(`next_execution_date = $${paramCount}`);
        updateValues.push(nextExecutionDate);
      }
      
      // تحديث is_active
      if (is_active !== undefined) {
        paramCount++;
        updateFields.push(`is_active = $${paramCount}`);
        updateValues.push(is_active);
      }
      
      // تحديث assigned_to
      if (assigned_to !== undefined) {
        paramCount++;
        updateFields.push(`assigned_to = $${paramCount}`);
        updateValues.push(assigned_to);
      }
      
      // تحديث priority
      if (priority !== undefined) {
        paramCount++;
        updateFields.push(`priority = $${paramCount}`);
        updateValues.push(priority);
      }
      
      // تحديث status
      if (status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(status);
      }
      
      // تحديث data مباشرة (إذا تم إرسالها مباشرة وليس في template_data)
      if (data !== undefined) {
        paramCount++;
        updateFields.push(`data = $${paramCount}`);
        updateValues.push(data);
      }
      
      // تحديث title مباشرة (إذا تم إرساله مباشرة وليس في template_data)
      if (title !== undefined) {
        paramCount++;
        updateFields.push(`title = $${paramCount}`);
        updateValues.push(title);
      }
      
      // تحديث max_executions
      if (max_executions !== undefined) {
        paramCount++;
        updateFields.push(`max_executions = $${paramCount}`);
        updateValues.push(max_executions === null ? null : parseInt(max_executions));
      }
      
      // إضافة updated_at دائماً
      updateFields.push('updated_at = NOW()');
      
      // إذا لم يكن هناك حقول للتحديث، أرجع القاعدة الحالية
      if (updateFields.length === 1) {
        return res.json({
          success: true,
          message: 'لم يتم تحديث أي حقول',
          data: formatRecurringRule(existingRule)
        });
      }
      
      // إضافة id في النهاية
      paramCount++;
      updateValues.push(id);
      
      // محاولة التحديث مع البنية الجديدة أولاً
      let result;
      try {
        const updateQuery = `
          UPDATE recurring_rules 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;
        result = await pool.query(updateQuery, updateValues);
      } catch (error) {
        // إذا فشل، جرب البنية القديمة
        if (error.message && (error.message.includes('recurrence_type') || error.message.includes('column'))) {
          // إعادة بناء الاستعلام للبنية القديمة
          const oldUpdateFields = [];
          const oldUpdateValues = [];
          let oldParamCount = 0;
          
          if (name !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`name = $${oldParamCount}`);
            oldUpdateValues.push(name);
          }
          if (description !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`description = $${oldParamCount}`);
            oldUpdateValues.push(description);
          }
          if (process_id !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`process_id = $${oldParamCount}`);
            oldUpdateValues.push(process_id);
          }
          if (template_data !== undefined) {
            oldParamCount++;
            const templateDataObject = typeof template_data === 'string'
              ? safeParseJSON(template_data, {})
              : template_data;
            oldUpdateFields.push(`template_data = $${oldParamCount}`);
            oldUpdateValues.push(templateDataObject);
          }
          if (schedule_type !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`schedule_type = $${oldParamCount}`);
            oldUpdateValues.push(schedule_type);
          }
          if (schedule_config !== undefined) {
            oldParamCount++;
            const scheduleConfigObject = typeof schedule_config === 'string'
              ? safeParseJSON(schedule_config, {})
              : schedule_config;
            oldUpdateFields.push(`schedule_config = $${oldParamCount}`);
            oldUpdateValues.push(scheduleConfigObject);
          }
          if (timezone !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`timezone = $${oldParamCount}`);
            oldUpdateValues.push(timezone);
          }
          if (is_active !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`is_active = $${oldParamCount}`);
            oldUpdateValues.push(is_active);
          }
          if (next_execution !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`next_execution = $${oldParamCount}`);
            oldUpdateValues.push(new Date(next_execution));
          }
          if (max_executions !== undefined) {
            oldParamCount++;
            oldUpdateFields.push(`max_executions = $${oldParamCount}`);
            oldUpdateValues.push(max_executions === null ? null : parseInt(max_executions));
          }
          
          oldUpdateFields.push('updated_at = NOW()');
          oldParamCount++;
          oldUpdateValues.push(id);
          
          const oldUpdateQuery = `
            UPDATE recurring_rules 
            SET ${oldUpdateFields.join(', ')}
            WHERE id = $${oldParamCount}
            RETURNING *
          `;
          result = await pool.query(oldUpdateQuery, oldUpdateValues);
        } else {
          throw error;
        }
      }
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      const updatedRule = formatRecurringRule(result.rows[0]);
      
      // التحقق من max_executions بعد التحديث
      // إذا تم تحديث max_executions وكان execution_count >= max_executions، تعطيل القاعدة
      if (max_executions !== undefined) {
        const currentExecutionCount = (updatedRule.execution_count !== null && updatedRule.execution_count !== undefined) 
          ? parseInt(updatedRule.execution_count) 
          : 0;
        const newMaxExecutions = max_executions === null ? null : parseInt(max_executions);
        
        if (newMaxExecutions !== null && currentExecutionCount >= newMaxExecutions && updatedRule.is_active) {
          // تحديث is_active إلى false
          await pool.query(
            `UPDATE recurring_rules SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [id]
          );
          
          // جلب القاعدة المحدثة مرة أخرى
          const finalResult = await pool.query(
            'SELECT * FROM recurring_rules WHERE id = $1',
            [id]
          );
          
          if (finalResult.rows.length > 0) {
            const finalRule = formatRecurringRule(finalResult.rows[0]);
            return res.json({
              success: true,
              message: `تم تحديث قاعدة التكرار بنجاح. تم تعطيل القاعدة تلقائياً لأن عدد التنفيذات الحالي (${currentExecutionCount}) وصل أو تجاوز الحد الأقصى (${newMaxExecutions})`,
              data: finalRule
            });
          }
        }
      }
      
      res.json({
        success: true,
        message: 'تم تحديث قاعدة التكرار بنجاح',
        data: updatedRule
      });
    } catch (error) {
      console.error('خطأ في تحديث قاعدة التكرار:', error);
      console.error('تفاصيل الخطأ:', {
        message: error.message,
        detail: error.detail,
        code: error.code,
        constraint: error.constraint
      });
      
      let errorMessage = 'خطأ في تحديث قاعدة التكرار';
      if (error.code === '23503') {
        if (error.constraint?.includes('process_id')) {
          errorMessage = 'العملية المحددة غير موجودة';
        } else {
          errorMessage = 'مرجع غير صحيح في البيانات';
        }
      } else if (error.code === '23502') {
        errorMessage = 'حقل مطلوب مفقود: ' + (error.column || 'غير محدد');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message,
        detail: process.env.NODE_ENV === 'development' ? error.detail : undefined,
        code: process.env.NODE_ENV === 'development' ? error.code : undefined
      });
    }
  }
  
  // حذف قاعدة تكرار
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        DELETE FROM recurring_rules 
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      res.json({
        success: true,
        message: 'تم حذف قاعدة التكرار بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف قاعدة التكرار',
        error: error.message
      });
    }
  }
  
  // تشغيل قاعدة تكرار يدوياً
  static async execute(req, res) {
    try {
      const { id } = req.params;
      
      // جلب قاعدة التكرار
      const ruleResult = await pool.query(`
        SELECT * FROM recurring_rules WHERE id = $1 AND is_active = true
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة أو غير نشطة'
        });
      }
      
      const rule = formatRecurringRule(ruleResult.rows[0]);
      
      // إنشاء تذكرة جديدة من القالب
      // التعامل مع البنية الجديدة (title, data) والقديمة (template_data)
      let templateData = {};
      if (rule.template_data) {
        templateData = typeof rule.template_data === 'string'
          ? safeParseJSON(rule.template_data, {})
          : rule.template_data;
      } else if (rule.title || rule.data) {
        // استخدام البنية الجديدة
        templateData = {
          title: rule.title,
          description: rule.description,
          data: rule.data || {}
        };
      }
      const processedData = processTemplate(templateData);

      const stageIdCandidate =
        processedData.current_stage_id ||
        processedData.stage_id ||
        rule.current_stage_id ||
        null;

      const stageId = await resolveStageId(rule.process_id, stageIdCandidate);

      if (!stageId) {
        throw new Error('لا يمكن تحديد مرحلة صالحة لهذه العملية');
      }

      const assignedToCandidate =
        processedData.assigned_to ||
        rule.assigned_to ||
        null;

      const assignedTo = await resolveAssignedUser(assignedToCandidate);

      const priority = processedData.priority || rule.priority || 'medium';
      const status = processedData.status || rule.status || 'active';
      const dueDate = processedData.due_date || rule.due_date || null;
      const rawTags = processedData.tags || rule.tags || null;
      const tags = normalizeTags(rawTags);

      const ticketResult = await pool.query(`
        INSERT INTO tickets (
          title,
          description,
          process_id,
          current_stage_id,
          assigned_to,
          priority,
          status,
          due_date,
          data,
          tags,
          created_by,
          ticket_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        processedData.title || rule.name || 'تذكرة متكررة',
        processedData.description || rule.description || '',
        rule.process_id,
        stageId,
        assignedTo,
        priority,
        status,
        dueDate,
        JSON.stringify(processedData.data || {}),
        tags,
        req.user.id,
        await generateTicketNumber(rule.process_id)
      ]);
      
      // تحديث آخر تنفيذ وحساب التنفيذ التالي
      const scheduleType = rule.schedule_type || rule.recurrence_type || 'daily';
      let scheduleConfig = {};
      
      if (rule.schedule_config) {
        scheduleConfig = typeof rule.schedule_config === 'string'
          ? safeParseJSON(rule.schedule_config, {})
          : rule.schedule_config;
      } else if (rule.recurrence_interval) {
        scheduleConfig = {
          interval: rule.recurrence_interval || 1,
          day_of_month: rule.month_day,
          days_of_week: rule.weekdays || []
        };
      }
      
      // إذا لم يكن هناك interval، استخدم recurring_worker_interval من الإعدادات
      if (!scheduleConfig.interval) {
        try {
          const Settings = require('../models/Settings');
          const settings = await Settings.getSettings();
          scheduleConfig.interval = settings.recurring_worker_interval || 1; // بالدقائق
        } catch (error) {
          console.warn('⚠️  تحذير: فشل جلب إعدادات recurring_worker_interval، سيتم استخدام 1 دقيقة');
          scheduleConfig.interval = 1; // افتراضي: 1 دقيقة
        }
      }
      
      const next_execution = calculateNextExecution(
        scheduleType, 
        scheduleConfig, 
        rule.timezone || 'Asia/Riyadh'
      );
      
      // محاولة التحديث مع البنية الجديدة أولاً
      try {
        await pool.query(`
          UPDATE recurring_rules 
          SET 
            last_execution_date = NOW(),
            execution_count = execution_count + 1,
            next_execution_date = $1
          WHERE id = $2
        `, [next_execution, id]);
      } catch (error) {
        // إذا فشل، جرب البنية القديمة
        if (error.message && error.message.includes('last_execution_date')) {
          await pool.query(`
            UPDATE recurring_rules 
            SET 
              last_executed = NOW(),
              execution_count = execution_count + 1,
              next_execution = $1
            WHERE id = $2
          `, [next_execution, id]);
        } else {
          throw error;
        }
      }
      
      res.json({
        success: true,
        message: 'تم تشغيل قاعدة التكرار وإنشاء تذكرة جديدة',
        data: {
          rule: rule,
          ticket: ticketResult.rows[0],
          next_execution
        }
      });
    } catch (error) {
      console.error('خطأ في تشغيل قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تشغيل قاعدة التكرار',
        error: error.detail || error.message
      });
    }
  }
  
  // تنفيذ جميع القواعد المستحقة يدوياً
  static async executeDue(req, res) {
    try {
      const RecurringExecutionService = require('../services/RecurringExecutionService');
      
      // جلب القواعد المستحقة
      const dueRules = await RecurringExecutionService.getDueRules();
      
      if (dueRules.length === 0) {
        return res.json({
          success: true,
          message: 'لا توجد قواعد مستحقة للتنفيذ حالياً',
          executed_count: 0,
          rules: []
        });
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      // تنفيذ كل قاعدة
      for (const rule of dueRules) {
        try {
          const result = await RecurringExecutionService.executeRule(rule.id, req.user?.id);
          results.push({
            rule_id: rule.id,
            rule_name: rule.name,
            ...result
          });
          
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          results.push({
            rule_id: rule.id,
            rule_name: rule.name,
            success: false,
            message: `خطأ في التنفيذ: ${error.message}`,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `تم تنفيذ ${successCount} من ${dueRules.length} قاعدة`,
        executed_count: successCount,
        error_count: errorCount,
        total_count: dueRules.length,
        results: results
      });
    } catch (error) {
      console.error('❌ خطأ في تنفيذ القواعد المستحقة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تنفيذ القواعد المستحقة',
        error: error.message
      });
    }
  }
  
  // جلب القواعد المستحقة للتنفيذ
  static async getDue(req, res) {
    try {
      // محاولة استخدام next_execution أولاً
      let result;
      try {
        result = await pool.query(`
          SELECT 
            rr.*,
            p.name as process_name
          FROM recurring_rules rr
          LEFT JOIN processes p ON rr.process_id = p.id
          WHERE rr.is_active = true 
          AND rr.next_execution <= NOW()
          ORDER BY rr.next_execution ASC
        `);
      } catch (error) {
        // إذا فشل، استخدم next_execution_date
        if (error.message && error.message.includes('next_execution')) {
          result = await pool.query(`
            SELECT 
              rr.*,
              p.name as process_name
            FROM recurring_rules rr
            LEFT JOIN processes p ON rr.process_id = p.id
            WHERE rr.is_active = true 
            AND rr.next_execution_date <= NOW()
            ORDER BY rr.next_execution_date ASC
          `);
        } else {
          throw error;
        }
      }
      
      res.json({
        success: true,
        data: result.rows.map(formatRecurringRule),
        count: result.rows.length
      });
    } catch (error) {
      console.error('خطأ في جلب القواعد المستحقة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب القواعد المستحقة',
        error: error.message
      });
    }
  }
}

// دوال مساعدة
function calculateNextExecution(scheduleType, scheduleConfig, timezone) {
  const now = new Date();
  const config = typeof scheduleConfig === 'string' ? safeParseJSON(scheduleConfig, {}) : (scheduleConfig || {});

  // interval في schedule_config: للدقائق (minutes) يكون بالدقائق، للأنواع الأخرى يكون عدد الوحدات
  const interval = config.interval || 1;
  
  let nextExecution = new Date(now);
  
  switch (scheduleType) {
    case 'minutes': {
      // للدقائق: interval بالدقائق
      nextExecution.setMinutes(nextExecution.getMinutes() + interval);
      break;
    }
    
    case 'daily': {
      // يومي: interval بالأيام (افتراضي: 1 يوم)
      nextExecution.setDate(nextExecution.getDate() + interval);
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        // إذا كان الوقت المحدد في الماضي، نضيف يوم إضافي
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + interval);
        }
      }
      break;
    }
    
    case 'weekly': {
      // أسبوعي: interval بالأسابيع (افتراضي: 1 أسبوع)
      nextExecution.setDate(nextExecution.getDate() + (7 * interval));
      // إذا كان هناك أيام محددة في الأسبوع
      if (config.days_of_week && Array.isArray(config.days_of_week) && config.days_of_week.length > 0) {
        // البحث عن أقرب يوم من الأيام المحددة
        const targetDays = config.days_of_week.map(d => parseInt(d, 10));
        let found = false;
        for (let i = 0; i < 14; i++) { // البحث في الأسبوعين القادمين
          const checkDate = new Date(now);
          checkDate.setDate(checkDate.getDate() + i);
          const dayOfWeek = checkDate.getDay(); // 0 = الأحد, 1 = الاثنين, ...
          if (targetDays.includes(dayOfWeek) && checkDate > now) {
            nextExecution = checkDate;
            found = true;
            break;
          }
        }
        if (!found) {
          // إذا لم نجد، نستخدم الأسبوع التالي
          nextExecution.setDate(nextExecution.getDate() + (7 * interval));
        }
      }
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      break;
    }
    
    case 'monthly': {
      // شهري: interval بالأشهر (افتراضي: 1 شهر)
      nextExecution.setMonth(nextExecution.getMonth() + interval);
      // إذا كان هناك يوم محدد من الشهر
      if (config.day_of_month) {
        const dayOfMonth = parseInt(config.day_of_month, 10);
        // التحقق من أن اليوم صالح للشهر
        const lastDayOfMonth = new Date(nextExecution.getFullYear(), nextExecution.getMonth() + 1, 0).getDate();
        nextExecution.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      }
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      // إذا كان التاريخ في الماضي، نضيف شهر إضافي
      if (nextExecution <= now) {
        nextExecution.setMonth(nextExecution.getMonth() + interval);
      }
      break;
    }
    
    case 'yearly': {
      // سنوي: interval بالسنوات (افتراضي: 1 سنة)
      nextExecution.setFullYear(nextExecution.getFullYear() + interval);
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      // إذا كان التاريخ في الماضي، نضيف سنة إضافية
      if (nextExecution <= now) {
        nextExecution.setFullYear(nextExecution.getFullYear() + interval);
      }
      break;
    }
    
    case 'custom':
    default: {
      // للأنواع الأخرى أو custom: نستخدم الدقائق (للتوافق مع الكود القديم)
      nextExecution.setMinutes(nextExecution.getMinutes() + interval);
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
      }
      break;
    }
  }
  
  return nextExecution;
}

function processTemplate(templateData) {
  const now = new Date();
  const processed = JSON.parse(JSON.stringify(templateData || {}));
  
  // معالجة المتغيرات في النص
  const variables = {
    '{{current_date}}': now.toLocaleDateString('ar-SA'),
    '{{current_time}}': now.toLocaleTimeString('ar-SA'),
    '{{current_month}}': now.toLocaleDateString('ar-SA', { month: 'long' }),
    '{{current_year}}': now.getFullYear().toString(),
    '{{week_number}}': getWeekNumber(now).toString()
  };
  
  function replaceVariables(obj) {
    if (typeof obj === 'string') {
      let result = obj;
      Object.keys(variables).forEach(key => {
        result = result.replace(new RegExp(key, 'g'), variables[key]);
      });
      return result;
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      Object.keys(obj).forEach(key => {
        newObj[key] = replaceVariables(obj[key]);
      });
      return newObj;
    }
    return obj;
  }
  
  return replaceVariables(processed);
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

async function generateTicketNumber(processId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const processSegment = processId ? String(processId).slice(0, 4).toUpperCase() : 'REC';
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${processSegment}-${year}${month}${day}-${random}`;
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function formatRecurringRule(rule) {
  if (!rule) {
    return rule;
  }

  const formatted = { ...rule };

  // معالجة template_data
  if (formatted.template_data && typeof formatted.template_data === 'string') {
    formatted.template_data = safeParseJSON(formatted.template_data, formatted.template_data);
  }
  
  // التأكد من أن template_data كائن
  if (!formatted.template_data || typeof formatted.template_data !== 'object') {
    formatted.template_data = {};
  }
  
  // ✅ دمج عمود data في template_data.data
  // إذا كان هناك عمود data منفصل في الجدول، ادمجه في template_data.data
  if (formatted.data !== undefined && formatted.data !== null) {
    let dataValue = formatted.data;
    
    // Parse إذا كان string
    if (typeof dataValue === 'string') {
      try {
        dataValue = JSON.parse(dataValue);
      } catch (e) {
        dataValue = {};
      }
    }
    
    // التأكد من أنه كائن
    if (typeof dataValue === 'object' && dataValue !== null && !Array.isArray(dataValue)) {
      // ✅ دمج data في template_data.data (الأولوية لـ data من العمود)
      formatted.template_data.data = { ...(formatted.template_data.data || {}), ...dataValue };
    } else {
      formatted.template_data.data = formatted.template_data.data || {};
    }
  } else {
    // إذا لم يكن هناك عمود data، استخدم template_data.data الموجود
    formatted.template_data.data = formatted.template_data.data || {};
  }

  if (formatted.schedule_config && typeof formatted.schedule_config === 'string') {
    formatted.schedule_config = safeParseJSON(formatted.schedule_config, formatted.schedule_config);
  }

  formatted.rule_name = formatted.rule_name || formatted.name;
  formatted.title = formatted.title || (formatted.template_data?.title ?? formatted.name);
  // التعامل مع أسماء الأعمدة المختلفة
  formatted.next_execution_date = formatted.next_execution_date || formatted.next_execution || null;
  formatted.last_execution_date = formatted.last_execution_date || formatted.last_executed || null;

  return formatted;
}

function normalizeTags(tags) {
  if (!tags) {
    return null;
  }

  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // تجاهل الخطأ، سيتم إرجاع العلامة كسلسلة واحدة
    }
    return [tags];
  }

  return null;
}

async function getDefaultStageId(processId) {
  if (!processId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT id
      FROM stages
      WHERE process_id = $1
      ORDER BY order_index ASC NULLS LAST, created_at ASC
      LIMIT 1
    `,
    [processId]
  );

  return result.rows[0]?.id || null;
}

async function resolveStageId(processId, candidateStageId) {
  if (candidateStageId) {
    const { rows } = await pool.query(
      `
        SELECT id
        FROM stages
        WHERE id = $1 AND process_id = $2
        LIMIT 1
      `,
      [candidateStageId, processId]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  return await getDefaultStageId(processId);
}

async function resolveAssignedUser(candidateUserId) {
  if (!candidateUserId) {
    return null;
  }

  const { rows } = await pool.query(
    `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [candidateUserId]
  );

  return rows.length > 0 ? rows[0].id : null;
}

module.exports = RecurringController;
