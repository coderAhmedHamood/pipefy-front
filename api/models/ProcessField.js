const { pool } = require('../config/database');

class ProcessField {
  // إنشاء حقل جديد
  static async create(fieldData) {
    const {
      process_id,
      name,
      label,
      field_type,
      is_required = false,
      is_system_field = false,
      is_searchable = true,
      is_filterable = true,
      default_value,
      options = [],
      validation_rules = [],
      help_text,
      placeholder,
      order_index,
      group_name,
      width = 'full'
    } = fieldData;

    // التحقق من عدم تكرار اسم الحقل
    const checkQuery = `
      SELECT id FROM process_fields 
      WHERE process_id = $1 AND name = $2
    `;
    const checkResult = await pool.query(checkQuery, [process_id, name]);
    
    if (checkResult.rows.length > 0) {
      throw new Error('اسم الحقل موجود بالفعل في هذه العملية');
    }

    // الحصول على الترتيب التالي إذا لم يتم تحديده
    let finalOrderIndex = order_index;
    if (!finalOrderIndex) {
      const orderQuery = `
        SELECT COALESCE(MAX(order_index), 0) + 1 as next_order
        FROM process_fields WHERE process_id = $1
      `;
      const orderResult = await pool.query(orderQuery, [process_id]);
      finalOrderIndex = orderResult.rows[0].next_order;
    }

    const query = `
      INSERT INTO process_fields (
        process_id, name, label, field_type, is_required, is_system_field,
        is_searchable, is_filterable, default_value, options, validation_rules,
        help_text, placeholder, order_index, group_name, width
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      process_id,
      name,
      label,
      field_type,
      is_required,
      is_system_field,
      is_searchable,
      is_filterable,
      JSON.stringify(default_value),
      JSON.stringify(options),
      JSON.stringify(validation_rules),
      help_text,
      placeholder,
      finalOrderIndex,
      group_name,
      width
    ];

    const result = await pool.query(query, values);
    return {
      ...result.rows[0],
      default_value: result.rows[0].default_value,
      options: result.rows[0].options,
      validation_rules: result.rows[0].validation_rules
    };
  }

  // جلب جميع حقول عملية معينة
  static async findByProcessId(processId, options = {}) {
    const {
      include_system_fields = true,
      group_by_name = false,
      order_by = 'order_index'
    } = options;

    let query = `
      SELECT *
      FROM process_fields
      WHERE process_id = $1
    `;

    if (!include_system_fields) {
      query += ` AND is_system_field = false`;
    }

    query += ` ORDER BY ${order_by}, created_at`;

    const result = await pool.query(query, [processId]);
    const fields = result.rows.map(field => ({
      ...field,
      default_value: field.default_value,
      options: field.options,
      validation_rules: field.validation_rules
    }));

    if (group_by_name) {
      const grouped = {};
      fields.forEach(field => {
        const group = field.group_name || 'default';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(field);
      });
      return grouped;
    }

    return fields;
  }

  // جلب حقل بالـ ID
  static async findById(id) {
    const query = `
      SELECT pf.*, p.name as process_name
      FROM process_fields pf
      JOIN processes p ON pf.process_id = p.id
      WHERE pf.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      default_value: result.rows[0].default_value,
      options: result.rows[0].options,
      validation_rules: result.rows[0].validation_rules
    };
  }

  // تحديث حقل
  static async update(id, updateData) {
    const {
      name,
      label,
      field_type,
      is_required,
      is_searchable,
      is_filterable,
      default_value,
      options,
      validation_rules,
      help_text,
      placeholder,
      order_index,
      group_name,
      width
    } = updateData;

    const fields = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(name);
    }

    if (label !== undefined) {
      paramCount++;
      fields.push(`label = $${paramCount}`);
      values.push(label);
    }

    if (field_type !== undefined) {
      paramCount++;
      fields.push(`field_type = $${paramCount}`);
      values.push(field_type);
    }

    if (is_required !== undefined) {
      paramCount++;
      fields.push(`is_required = $${paramCount}`);
      values.push(is_required);
    }

    if (is_searchable !== undefined) {
      paramCount++;
      fields.push(`is_searchable = $${paramCount}`);
      values.push(is_searchable);
    }

    if (is_filterable !== undefined) {
      paramCount++;
      fields.push(`is_filterable = $${paramCount}`);
      values.push(is_filterable);
    }

    if (default_value !== undefined) {
      paramCount++;
      fields.push(`default_value = $${paramCount}`);
      values.push(JSON.stringify(default_value));
    }

    if (options !== undefined) {
      paramCount++;
      fields.push(`options = $${paramCount}`);
      values.push(JSON.stringify(options));
    }

    if (validation_rules !== undefined) {
      paramCount++;
      fields.push(`validation_rules = $${paramCount}`);
      values.push(JSON.stringify(validation_rules));
    }

    if (help_text !== undefined) {
      paramCount++;
      fields.push(`help_text = $${paramCount}`);
      values.push(help_text);
    }

    if (placeholder !== undefined) {
      paramCount++;
      fields.push(`placeholder = $${paramCount}`);
      values.push(placeholder);
    }

    if (order_index !== undefined) {
      paramCount++;
      fields.push(`order_index = $${paramCount}`);
      values.push(order_index);
    }

    if (group_name !== undefined) {
      paramCount++;
      fields.push(`group_name = $${paramCount}`);
      values.push(group_name);
    }

    if (width !== undefined) {
      paramCount++;
      fields.push(`width = $${paramCount}`);
      values.push(width);
    }

    if (fields.length === 0) {
      throw new Error('لا توجد حقول للتحديث');
    }

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(id);

    const query = `
      UPDATE process_fields 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return {
      ...result.rows[0],
      default_value: result.rows[0].default_value,
      options: result.rows[0].options,
      validation_rules: result.rows[0].validation_rules
    };
  }

  // حذف حقل
  static async delete(id) {
    // التحقق من عدم كون الحقل حقل نظام
    const checkQuery = `
      SELECT is_system_field FROM process_fields WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('الحقل غير موجود');
    }

    if (checkResult.rows[0].is_system_field) {
      throw new Error('لا يمكن حذف حقول النظام');
    }

    const query = `
      DELETE FROM process_fields WHERE id = $1 RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // إنشاء حقول افتراضية للعملية
  static async createDefaultFields(processId) {
    const defaultFields = [
      {
        name: 'title',
        label: 'العنوان',
        field_type: 'text',
        is_required: true,
        is_system_field: true,
        is_searchable: true,
        is_filterable: true,
        placeholder: 'أدخل عنوان الطلب',
        order_index: 1,
        group_name: 'basic_info',
        width: 'full'
      },
      {
        name: 'description',
        label: 'الوصف',
        field_type: 'textarea',
        is_required: false,
        is_system_field: true,
        is_searchable: true,
        is_filterable: false,
        placeholder: 'أدخل وصف مفصل للطلب',
        order_index: 2,
        group_name: 'basic_info',
        width: 'full'
      },
      {
        name: 'priority',
        label: 'الأولوية',
        field_type: 'select',
        is_required: true,
        is_system_field: true,
        is_searchable: false,
        is_filterable: true,
        default_value: 'medium',
        options: [
          { value: 'low', label: 'منخفضة', color: '#10B981' },
          { value: 'medium', label: 'متوسطة', color: '#F59E0B' },
          { value: 'high', label: 'عالية', color: '#EF4444' },
          { value: 'urgent', label: 'عاجلة', color: '#DC2626' }
        ],
        order_index: 3,
        group_name: 'basic_info',
        width: 'half'
      },
      {
        name: 'due_date',
        label: 'تاريخ الاستحقاق',
        field_type: 'date',
        is_required: false,
        is_system_field: true,
        is_searchable: false,
        is_filterable: true,
        order_index: 4,
        group_name: 'basic_info',
        width: 'half'
      }
    ];

    const createdFields = [];
    for (let fieldData of defaultFields) {
      const field = await this.create({
        ...fieldData,
        process_id: processId
      });
      createdFields.push(field);
    }

    return createdFields;
  }

  // تحديث ترتيب الحقول
  static async updateOrder(processId, fieldOrders) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (let i = 0; i < fieldOrders.length; i++) {
        const { id, order_index } = fieldOrders[i];
        
        const updateQuery = `
          UPDATE process_fields 
          SET order_index = $1, updated_at = NOW()
          WHERE id = $2 AND process_id = $3
        `;
        
        await client.query(updateQuery, [
          order_index || (i + 1),
          id,
          processId
        ]);
      }

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // التحقق من صحة قيمة الحقل
  static validateFieldValue(field, value) {
    const errors = [];

    // التحقق من الحقول المطلوبة
    if (field.is_required && (value === null || value === undefined || value === '')) {
      errors.push(`الحقل "${field.label}" مطلوب`);
      return errors;
    }

    // إذا كانت القيمة فارغة والحقل غير مطلوب، فلا حاجة للتحقق
    if (!value && !field.is_required) {
      return errors;
    }

    // التحقق حسب نوع الحقل
    switch (field.field_type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`الحقل "${field.label}" يجب أن يكون بريد إلكتروني صحيح`);
        }
        break;

      case 'phone':
        const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
        if (!phoneRegex.test(value)) {
          errors.push(`الحقل "${field.label}" يجب أن يكون رقم هاتف صحيح`);
        }
        break;

      case 'number':
        if (isNaN(value)) {
          errors.push(`الحقل "${field.label}" يجب أن يكون رقم`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`الحقل "${field.label}" يجب أن يكون رابط صحيح`);
        }
        break;

      case 'select':
      case 'radio':
        const validOptions = field.options.map(opt => opt.value);
        if (!validOptions.includes(value)) {
          errors.push(`قيمة الحقل "${field.label}" غير صحيحة`);
        }
        break;

      case 'multiselect':
      case 'checkbox':
        if (!Array.isArray(value)) {
          errors.push(`الحقل "${field.label}" يجب أن يكون مصفوفة`);
        } else {
          const validOptions = field.options.map(opt => opt.value);
          const invalidValues = value.filter(v => !validOptions.includes(v));
          if (invalidValues.length > 0) {
            errors.push(`قيم غير صحيحة في الحقل "${field.label}": ${invalidValues.join(', ')}`);
          }
        }
        break;
    }

    // التحقق من قواعد التحقق المخصصة
    if (field.validation_rules && field.validation_rules.length > 0) {
      for (let rule of field.validation_rules) {
        switch (rule.type) {
          case 'min_length':
            if (value.length < rule.value) {
              errors.push(`الحقل "${field.label}" يجب أن يكون ${rule.value} أحرف على الأقل`);
            }
            break;

          case 'max_length':
            if (value.length > rule.value) {
              errors.push(`الحقل "${field.label}" يجب أن يكون ${rule.value} أحرف كحد أقصى`);
            }
            break;

          case 'min_value':
            if (parseFloat(value) < rule.value) {
              errors.push(`الحقل "${field.label}" يجب أن يكون ${rule.value} كحد أدنى`);
            }
            break;

          case 'max_value':
            if (parseFloat(value) > rule.value) {
              errors.push(`الحقل "${field.label}" يجب أن يكون ${rule.value} كحد أقصى`);
            }
            break;

          case 'regex':
            const regex = new RegExp(rule.value);
            if (!regex.test(value)) {
              errors.push(rule.message || `الحقل "${field.label}" لا يطابق النمط المطلوب`);
            }
            break;
        }
      }
    }

    return errors;
  }

  // جلب جميع الحقول مع التصفية
  static async findAll(filters = {}, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT pf.*, p.name as process_name
        FROM process_fields pf
        LEFT JOIN processes p ON pf.process_id = p.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (filters.process_id) {
        query += ` AND pf.process_id = $${paramIndex}`;
        params.push(filters.process_id);
        paramIndex++;
      }

      if (filters.field_type) {
        query += ` AND pf.field_type = $${paramIndex}`;
        params.push(filters.field_type);
        paramIndex++;
      }

      if (filters.is_required !== undefined) {
        query += ` AND pf.is_required = $${paramIndex}`;
        params.push(filters.is_required);
        paramIndex++;
      }

      if (filters.group_name) {
        query += ` AND pf.group_name = $${paramIndex}`;
        params.push(filters.group_name);
        paramIndex++;
      }

      if (filters.search) {
        query += ` AND (pf.name ILIKE $${paramIndex} OR pf.label ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY pf.process_id, pf.order_index`;

      // إضافة LIMIT و OFFSET
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // جلب العدد الإجمالي
      let countQuery = `
        SELECT COUNT(*) as total
        FROM process_fields pf
        LEFT JOIN processes p ON pf.process_id = p.id
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (filters.process_id) {
        countQuery += ` AND pf.process_id = $${countParamIndex}`;
        countParams.push(filters.process_id);
        countParamIndex++;
      }

      if (filters.field_type) {
        countQuery += ` AND pf.field_type = $${countParamIndex}`;
        countParams.push(filters.field_type);
        countParamIndex++;
      }

      if (filters.is_required !== undefined) {
        countQuery += ` AND pf.is_required = $${countParamIndex}`;
        countParams.push(filters.is_required);
        countParamIndex++;
      }

      if (filters.group_name) {
        countQuery += ` AND pf.group_name = $${countParamIndex}`;
        countParams.push(filters.group_name);
        countParamIndex++;
      }

      if (filters.search) {
        countQuery += ` AND (pf.name ILIKE $${countParamIndex} OR pf.label ILIKE $${countParamIndex})`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);

      return {
        fields: result.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      throw error;
    }
  }

  // جلب الحقول حسب العملية
  static async findByProcessId(processId) {
    try {
      const result = await pool.query(`
        SELECT * FROM process_fields
        WHERE process_id = $1
        ORDER BY order_index
      `, [processId]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // إعادة ترتيب الحقول
  static async reorderFields(processId, fieldOrders) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const { field_id, order_index } of fieldOrders) {
        await client.query(
          'UPDATE process_fields SET order_index = $1 WHERE id = $2 AND process_id = $3',
          [order_index, field_id, processId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // التحقق من صحة قيمة الحقل (async version)
  static async validateFieldValue(field, value) {
    const errors = this.validateFieldValue(field, value);
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ProcessField;
