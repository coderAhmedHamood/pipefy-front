const { pool } = require('../config/database');

class StageTransition {
  // إنشاء انتقال جديد بين المراحل
  static async create(transitionData) {
    const {
      from_stage_id,
      to_stage_id,
      transition_type = 'manual',
      conditions = [],
      required_permissions = [],
      is_default = false,
      display_name,
      confirmation_required = false,
      button_color = '#3B82F6',
      button_icon,
      order_index = 1
    } = transitionData;

    // التحقق من عدم وجود انتقال مكرر
    const checkQuery = `
      SELECT id FROM stage_transitions 
      WHERE from_stage_id = $1 AND to_stage_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [from_stage_id, to_stage_id]);
    
    if (checkResult.rows.length > 0) {
      throw new Error('الانتقال موجود بالفعل بين هاتين المرحلتين');
    }

    // التحقق من أن المرحلتين تنتميان لنفس العملية
    const stagesQuery = `
      SELECT s1.process_id as from_process, s2.process_id as to_process
      FROM stages s1, stages s2
      WHERE s1.id = $1 AND s2.id = $2
    `;
    const stagesResult = await pool.query(stagesQuery, [from_stage_id, to_stage_id]);
    
    if (stagesResult.rows.length === 0) {
      throw new Error('إحدى المراحل غير موجودة');
    }

    const { from_process, to_process } = stagesResult.rows[0];
    if (from_process !== to_process) {
      throw new Error('لا يمكن إنشاء انتقال بين مراحل من عمليات مختلفة');
    }

    const query = `
      INSERT INTO stage_transitions (
        from_stage_id, to_stage_id, transition_type, conditions,
        required_permissions, is_default, display_name, confirmation_required,
        button_color, button_icon, order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      from_stage_id,
      to_stage_id,
      transition_type,
      JSON.stringify(conditions),
      required_permissions,
      is_default,
      display_name,
      confirmation_required,
      button_color,
      button_icon,
      order_index
    ];

    const result = await pool.query(query, values);
    return {
      ...result.rows[0],
      conditions: result.rows[0].conditions
    };
  }

  // جلب جميع انتقالات مرحلة معينة
  static async findByFromStageId(fromStageId) {
    const query = `
      SELECT st.*, 
             s.name as to_stage_name,
             s.color as to_stage_color,
             s.description as to_stage_description
      FROM stage_transitions st
      JOIN stages s ON st.to_stage_id = s.id
      WHERE st.from_stage_id = $1
      ORDER BY st.order_index, st.created_at
    `;

    const result = await pool.query(query, [fromStageId]);
    return result.rows.map(transition => ({
      ...transition,
      conditions: transition.conditions
    }));
  }

  // جلب جميع انتقالات عملية معينة
  static async findByProcessId(processId) {
    const query = `
      SELECT st.*, 
             s1.name as from_stage_name,
             s1.color as from_stage_color,
             s2.name as to_stage_name,
             s2.color as to_stage_color
      FROM stage_transitions st
      JOIN stages s1 ON st.from_stage_id = s1.id
      JOIN stages s2 ON st.to_stage_id = s2.id
      WHERE s1.process_id = $1
      ORDER BY s1.order_index, st.order_index
    `;

    const result = await pool.query(query, [processId]);
    return result.rows.map(transition => ({
      ...transition,
      conditions: transition.conditions
    }));
  }

  // جلب انتقال بالـ ID
  static async findById(id) {
    const query = `
      SELECT st.*, 
             s1.name as from_stage_name,
             s1.color as from_stage_color,
             s2.name as to_stage_name,
             s2.color as to_stage_color,
             p.name as process_name
      FROM stage_transitions st
      JOIN stages s1 ON st.from_stage_id = s1.id
      JOIN stages s2 ON st.to_stage_id = s2.id
      JOIN processes p ON s1.process_id = p.id
      WHERE st.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      conditions: result.rows[0].conditions
    };
  }

  // تحديث انتقال
  static async update(id, updateData) {
    const {
      transition_type,
      conditions,
      required_permissions,
      is_default,
      display_name,
      confirmation_required,
      button_color,
      button_icon,
      order_index
    } = updateData;

    const fields = [];
    const values = [];
    let paramCount = 0;

    if (transition_type !== undefined) {
      paramCount++;
      fields.push(`transition_type = $${paramCount}`);
      values.push(transition_type);
    }

    if (conditions !== undefined) {
      paramCount++;
      fields.push(`conditions = $${paramCount}`);
      values.push(JSON.stringify(conditions));
    }

    if (required_permissions !== undefined) {
      paramCount++;
      fields.push(`required_permissions = $${paramCount}`);
      values.push(required_permissions);
    }

    if (is_default !== undefined) {
      paramCount++;
      fields.push(`is_default = $${paramCount}`);
      values.push(is_default);
    }

    if (display_name !== undefined) {
      paramCount++;
      fields.push(`display_name = $${paramCount}`);
      values.push(display_name);
    }

    if (confirmation_required !== undefined) {
      paramCount++;
      fields.push(`confirmation_required = $${paramCount}`);
      values.push(confirmation_required);
    }

    if (button_color !== undefined) {
      paramCount++;
      fields.push(`button_color = $${paramCount}`);
      values.push(button_color);
    }

    if (button_icon !== undefined) {
      paramCount++;
      fields.push(`button_icon = $${paramCount}`);
      values.push(button_icon);
    }

    if (order_index !== undefined) {
      paramCount++;
      fields.push(`order_index = $${paramCount}`);
      values.push(order_index);
    }

    if (fields.length === 0) {
      throw new Error('لا توجد حقول للتحديث');
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE stage_transitions 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return {
      ...result.rows[0],
      conditions: result.rows[0].conditions
    };
  }

  // حذف انتقال
  static async delete(id) {
    const query = `
      DELETE FROM stage_transitions WHERE id = $1 RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // التحقق من إمكانية الانتقال
  static async canTransition(fromStageId, toStageId, ticketData = {}, userPermissions = []) {
    const query = `
      SELECT * FROM stage_transitions 
      WHERE from_stage_id = $1 AND to_stage_id = $2
    `;

    const result = await pool.query(query, [fromStageId, toStageId]);
    if (result.rows.length === 0) {
      return { allowed: false, reason: 'الانتقال غير مسموح' };
    }

    const transition = {
      ...result.rows[0],
      conditions: result.rows[0].conditions
    };

    // التحقق من الصلاحيات المطلوبة
    if (transition.required_permissions && transition.required_permissions.length > 0) {
      const hasPermissions = transition.required_permissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermissions) {
        return { 
          allowed: false, 
          reason: 'ليس لديك الصلاحيات المطلوبة لهذا الانتقال' 
        };
      }
    }

    // التحقق من الشروط
    if (transition.conditions && transition.conditions.length > 0) {
      for (let condition of transition.conditions) {
        const isConditionMet = this.evaluateCondition(condition, ticketData);
        if (!isConditionMet) {
          return { 
            allowed: false, 
            reason: condition.error_message || 'الشروط المطلوبة للانتقال غير متوفرة' 
          };
        }
      }
    }

    return { allowed: true, transition };
  }

  // تقييم شرط معين
  static evaluateCondition(condition, ticketData) {
    const { field_name, operator, value, field_type = 'text' } = condition;
    const fieldValue = ticketData[field_name];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      
      case 'not_equals':
        return fieldValue !== value;
      
      case 'contains':
        return fieldValue && fieldValue.toString().includes(value);
      
      case 'not_contains':
        return !fieldValue || !fieldValue.toString().includes(value);
      
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(value);
      
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(value);
      
      case 'greater_equal':
        return parseFloat(fieldValue) >= parseFloat(value);
      
      case 'less_equal':
        return parseFloat(fieldValue) <= parseFloat(value);
      
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      
      case 'in_list':
        return Array.isArray(value) && value.includes(fieldValue);
      
      case 'not_in_list':
        return !Array.isArray(value) || !value.includes(fieldValue);
      
      case 'date_before':
        return new Date(fieldValue) < new Date(value);
      
      case 'date_after':
        return new Date(fieldValue) > new Date(value);
      
      case 'regex_match':
        const regex = new RegExp(value);
        return regex.test(fieldValue);
      
      default:
        return false;
    }
  }

  // إنشاء انتقالات افتراضية للعملية
  static async createDefaultTransitions(processId) {
    // جلب مراحل العملية
    const stagesQuery = `
      SELECT * FROM stages 
      WHERE process_id = $1 
      ORDER BY order_index
    `;
    const stagesResult = await pool.query(stagesQuery, [processId]);
    const stages = stagesResult.rows;

    if (stages.length < 2) {
      return [];
    }

    const transitions = [];

    // إنشاء انتقالات تسلسلية بين المراحل
    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];

      const transition = await this.create({
        from_stage_id: fromStage.id,
        to_stage_id: toStage.id,
        display_name: `إلى ${toStage.name}`,
        is_default: true,
        order_index: 1
      });

      transitions.push(transition);
    }

    // إضافة انتقال للرجوع من المرحلة الثانية للأولى (رفض)
    if (stages.length >= 2) {
      const rejectTransition = await this.create({
        from_stage_id: stages[1].id,
        to_stage_id: stages[0].id,
        display_name: 'رفض',
        button_color: '#EF4444',
        button_icon: 'XCircle',
        order_index: 2
      });

      transitions.push(rejectTransition);
    }

    return transitions;
  }

  // تحديث ترتيب الانتقالات
  static async updateOrder(fromStageId, transitionOrders) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (let i = 0; i < transitionOrders.length; i++) {
        const { id, order_index } = transitionOrders[i];
        
        const updateQuery = `
          UPDATE stage_transitions 
          SET order_index = $1
          WHERE id = $2 AND from_stage_id = $3
        `;
        
        await client.query(updateQuery, [
          order_index || (i + 1),
          id,
          fromStageId
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

  // جلب الانتقال الافتراضي من مرحلة معينة
  static async getDefaultTransition(fromStageId) {
    const query = `
      SELECT st.*, 
             s.name as to_stage_name,
             s.color as to_stage_color
      FROM stage_transitions st
      JOIN stages s ON st.to_stage_id = s.id
      WHERE st.from_stage_id = $1 AND st.is_default = true
      ORDER BY st.order_index
      LIMIT 1
    `;

    const result = await pool.query(query, [fromStageId]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      conditions: result.rows[0].conditions
    };
  }
}

module.exports = StageTransition;
