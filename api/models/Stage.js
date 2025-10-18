const { pool } = require('../config/database');

class Stage {
  // إنشاء مرحلة جديدة
  static async create(stageData) {
    const {
      process_id,
      name,
      description,
      color = '#6B7280',
      order_index,
      priority,
      is_initial = false,
      is_final = false,
      sla_hours,
      required_permissions = [],
      automation_rules = [],
      settings = {},
      parent_stage_id = null,
      allowed_transitions = []
    } = stageData;

    // التحقق من تكرار اسم المرحلة في نفس المستوى الهرمي
    await this.validateUniqueNameInHierarchy(process_id, name, parent_stage_id);

    // التحقق من عدم تكرار الترتيب أو الأولوية والحصول على القيم التالية
    const checkAndGetNextQuery = `
      SELECT
        COALESCE(MAX(order_index), 0) + 1 as next_order,
        COALESCE(MAX(priority), 0) + 1 as next_priority,
        COUNT(CASE WHEN order_index = $2 THEN 1 END) as order_exists,
        COUNT(CASE WHEN priority = $3 THEN 1 END) as priority_exists
      FROM stages
      WHERE process_id = $1
    `;
    const checkResult = await pool.query(checkAndGetNextQuery, [process_id, order_index, priority]);
    const { next_order, next_priority, order_exists, priority_exists } = checkResult.rows[0];

    // استخدام القيم التالية المتاحة إذا كانت القيم المرسلة مكررة
    if (parseInt(order_exists) > 0 || parseInt(priority_exists) > 0) {
      console.log(`🔄 تعديل القيم المكررة - الترتيب: ${order_index} → ${next_order}, الأولوية: ${priority} → ${next_priority}`);
      stageData.order_index = next_order;
      stageData.priority = next_priority;
    } else {
      // استخدام القيم المرسلة إذا لم تكن مكررة
      stageData.order_index = order_index;
      stageData.priority = priority;
    }

    const query = `
      INSERT INTO stages (
        process_id, name, description, color, order_index, priority,
        is_initial, is_final, sla_hours, required_permissions, 
        automation_rules, settings
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      process_id,
      name,
      description,
      color,
      stageData.order_index,
      stageData.priority,
      is_initial,
      is_final,
      sla_hours,
      required_permissions,
      JSON.stringify(automation_rules),
      JSON.stringify(settings)
    ];

    const result = await pool.query(query, values);
    const newStage = result.rows[0];
    
    // حفظ الانتقالات المسموحة إذا تم تمريرها
    if (allowed_transitions && allowed_transitions.length > 0) {
      await this.updateAllowedTransitions(newStage.id, allowed_transitions);
    }
    
    // إرجاع المرحلة مع الانتقالات
    const stageWithTransitions = await this.findById(newStage.id, { include_transitions: true });
    return stageWithTransitions;
  }

  // التحقق من تفرد اسم المرحلة في نفس المستوى الهرمي
  static async validateUniqueNameInHierarchy(process_id, name, parent_stage_id = null, exclude_id = null) {
    let query;
    let params;

    if (parent_stage_id) {
      // التحقق من التفرد في نفس المرحلة الأب
      query = `
        SELECT id, name FROM stages
        WHERE process_id = $1 AND parent_stage_id = $2 AND LOWER(name) = LOWER($3)
        ${exclude_id ? 'AND id != $4' : ''}
      `;
      params = exclude_id ? [process_id, parent_stage_id, name, exclude_id] : [process_id, parent_stage_id, name];
    } else {
      // التحقق من التفرد في المستوى الجذر (المراحل الرئيسية)
      query = `
        SELECT id, name FROM stages
        WHERE process_id = $1 AND parent_stage_id IS NULL AND LOWER(name) = LOWER($2)
        ${exclude_id ? 'AND id != $3' : ''}
      `;
      params = exclude_id ? [process_id, name, exclude_id] : [process_id, name];
    }

    const result = await pool.query(query, params);

    if (result.rows.length > 0) {
      const hierarchyLevel = parent_stage_id ? 'المرحلة الفرعية' : 'المرحلة الرئيسية';
      throw new Error(`اسم ${hierarchyLevel} "${name}" موجود بالفعل في نفس المستوى الهرمي`);
    }
  }

  // جلب جميع مراحل عملية معينة
  static async findByProcessId(processId, options = {}) {
    const {
      include_transitions = false,
      include_tickets_count = false,
      order_by = 'order_index'
    } = options;

    let query = `
      SELECT s.*
      ${include_tickets_count ? ', COUNT(t.id) as tickets_count' : ''}
      FROM stages s
      ${include_tickets_count ? 'LEFT JOIN tickets t ON s.id = t.current_stage_id' : ''}
      WHERE s.process_id = $1
      ${include_tickets_count ? 'GROUP BY s.id' : ''}
      ORDER BY s.${order_by}, s.created_at
    `;

    const result = await pool.query(query, [processId]);
    const stages = result.rows.map(stage => ({
      ...stage,
      automation_rules: stage.automation_rules,
      settings: stage.settings
    }));

    if (include_transitions) {
      for (let stage of stages) {
        stage.transitions = await this.getTransitions(stage.id);
        stage.allowed_transitions = stage.transitions.map(t => t.to_stage_id);
      }
    } else {
      // جلب allowed_transitions لجميع المراحل
      for (let stage of stages) {
        const transitionsResult = await pool.query(
          'SELECT to_stage_id FROM stage_transitions WHERE from_stage_id = $1 ORDER BY order_index',
          [stage.id]
        );
        stage.allowed_transitions = transitionsResult.rows.map(t => t.to_stage_id);
      }
    }

    return stages;
  }

  // جلب مرحلة بالـ ID
  static async findById(id, options = {}) {
    const { include_transitions = false } = options;

    const query = `
      SELECT s.*, p.name as process_name
      FROM stages s
      JOIN processes p ON s.process_id = p.id
      WHERE s.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const stage = {
      ...result.rows[0],
      automation_rules: result.rows[0].automation_rules,
      settings: result.rows[0].settings
    };

    if (include_transitions) {
      stage.transitions = await this.getTransitions(id);
      // إضافة allowed_transitions كمصفوفة من معرفات المراحل
      stage.allowed_transitions = stage.transitions.map(t => t.to_stage_id);
    } else {
      // جلب allowed_transitions حتى لو لم يتم طلب التفاصيل الكاملة
      const transitionsResult = await pool.query(
        'SELECT to_stage_id FROM stage_transitions WHERE from_stage_id = $1 ORDER BY order_index',
        [id]
      );
      stage.allowed_transitions = transitionsResult.rows.map(t => t.to_stage_id);
    }

    return stage;
  }

  // تحديث مرحلة
  static async update(id, updateData) {
    const {
      name,
      description,
      color,
      order_index,
      priority,
      is_initial,
      is_final,
      sla_hours,
      required_permissions,
      automation_rules,
      settings,
      allowed_transitions
    } = updateData;

    const fields = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      // التحقق من تفرد الاسم الجديد في نفس المستوى الهرمي
      const currentStage = await this.findById(id);
      if (currentStage) {
        await this.validateUniqueNameInHierarchy(
          currentStage.process_id,
          name,
          currentStage.parent_stage_id,
          id
        );
      }

      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (color !== undefined) {
      paramCount++;
      fields.push(`color = $${paramCount}`);
      values.push(color);
    }

    if (order_index !== undefined) {
      paramCount++;
      fields.push(`order_index = $${paramCount}`);
      values.push(order_index);
    }

    if (priority !== undefined) {
      paramCount++;
      fields.push(`priority = $${paramCount}`);
      values.push(priority);
    }

    if (is_initial !== undefined) {
      paramCount++;
      fields.push(`is_initial = $${paramCount}`);
      values.push(is_initial);
    }

    if (is_final !== undefined) {
      paramCount++;
      fields.push(`is_final = $${paramCount}`);
      values.push(is_final);
    }

    if (sla_hours !== undefined) {
      paramCount++;
      fields.push(`sla_hours = $${paramCount}`);
      values.push(sla_hours);
    }

    if (required_permissions !== undefined) {
      paramCount++;
      fields.push(`required_permissions = $${paramCount}`);
      values.push(required_permissions);
    }

    if (automation_rules !== undefined) {
      paramCount++;
      fields.push(`automation_rules = $${paramCount}`);
      values.push(JSON.stringify(automation_rules));
    }

    if (settings !== undefined) {
      paramCount++;
      fields.push(`settings = $${paramCount}`);
      values.push(JSON.stringify(settings));
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
      UPDATE stages
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const updatedStage = result.rows[0];

    // تحديث الانتقالات المسموحة إذا تم تمريرها
    if (allowed_transitions !== undefined && Array.isArray(allowed_transitions)) {
      await this.updateAllowedTransitions(id, allowed_transitions);
    }

    // إرجاع المرحلة مع الانتقالات المحدثة
    const stageWithTransitions = await this.findById(id, { include_transitions: true });
    return stageWithTransitions;
  }

  // حذف مرحلة
  static async delete(id) {
    // التحقق من عدم وجود تذاكر في هذه المرحلة
    const ticketsQuery = `
      SELECT COUNT(*) as count FROM tickets WHERE current_stage_id = $1
    `;
    const ticketsResult = await pool.query(ticketsQuery, [id]);
    
    if (parseInt(ticketsResult.rows[0].count) > 0) {
      throw new Error('لا يمكن حذف مرحلة تحتوي على تذاكر');
    }

    const query = `
      DELETE FROM stages WHERE id = $1 RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // جلب انتقالات المرحلة
  static async getTransitions(stageId) {
    const query = `
      SELECT st.*, 
             s.name as to_stage_name,
             s.color as to_stage_color
      FROM stage_transitions st
      JOIN stages s ON st.to_stage_id = s.id
      WHERE st.from_stage_id = $1
      ORDER BY st.order_index
    `;

    const result = await pool.query(query, [stageId]);
    return result.rows.map(transition => ({
      ...transition,
      conditions: transition.conditions
    }));
  }

  // إعادة ترتيب المراحل
  static async reorderStages(processId) {
    const query = `
      SELECT reorder_stages($1)
    `;
    await pool.query(query, [processId]);
  }

  // تحديث ترتيب المراحل
  static async updateOrder(processId, stageOrders) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (let i = 0; i < stageOrders.length; i++) {
        const { id, order_index, priority } = stageOrders[i];
        
        const updateQuery = `
          UPDATE stages 
          SET order_index = $1, priority = $2, updated_at = NOW()
          WHERE id = $3 AND process_id = $4
        `;
        
        await client.query(updateQuery, [
          order_index || (i + 1),
          priority || (i + 1),
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

  // جلب المرحلة الأولى للعملية
  static async getInitialStage(processId) {
    const query = `
      SELECT * FROM stages 
      WHERE process_id = $1 AND is_initial = true
      ORDER BY order_index, priority
      LIMIT 1
    `;

    const result = await pool.query(query, [processId]);
    return result.rows[0] || null;
  }

  // جلب المراحل النهائية للعملية
  static async getFinalStages(processId) {
    const query = `
      SELECT * FROM stages 
      WHERE process_id = $1 AND is_final = true
      ORDER BY order_index, priority
    `;

    const result = await pool.query(query, [processId]);
    return result.rows;
  }

  // التحقق من إمكانية الانتقال بين المراحل
  static async canTransition(fromStageId, toStageId) {
    const query = `
      SELECT id FROM stage_transitions
      WHERE from_stage_id = $1 AND to_stage_id = $2
    `;

    const result = await pool.query(query, [fromStageId, toStageId]);
    return result.rows.length > 0;
  }

  // جلب جميع المراحل مع التصفية
  static async findAll(filters = {}, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT s.*, p.name as process_name,
               COUNT(t.id) as tickets_count
        FROM stages s
        LEFT JOIN processes p ON s.process_id = p.id
        LEFT JOIN tickets t ON s.id = t.current_stage_id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (filters.process_id) {
        query += ` AND s.process_id = $${paramIndex}`;
        params.push(filters.process_id);
        paramIndex++;
      }

      if (filters.is_initial !== undefined) {
        query += ` AND s.is_initial = $${paramIndex}`;
        params.push(filters.is_initial);
        paramIndex++;
      }

      if (filters.is_final !== undefined) {
        query += ` AND s.is_final = $${paramIndex}`;
        params.push(filters.is_final);
        paramIndex++;
      }

      if (filters.search) {
        query += ` AND (s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY s.id, p.name ORDER BY s.process_id, s.order_index, s.priority`;

      // إضافة LIMIT و OFFSET
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // جلب العدد الإجمالي
      let countQuery = `
        SELECT COUNT(DISTINCT s.id) as total
        FROM stages s
        LEFT JOIN processes p ON s.process_id = p.id
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (filters.process_id) {
        countQuery += ` AND s.process_id = $${countParamIndex}`;
        countParams.push(filters.process_id);
        countParamIndex++;
      }

      if (filters.is_initial !== undefined) {
        countQuery += ` AND s.is_initial = $${countParamIndex}`;
        countParams.push(filters.is_initial);
        countParamIndex++;
      }

      if (filters.is_final !== undefined) {
        countQuery += ` AND s.is_final = $${countParamIndex}`;
        countParams.push(filters.is_final);
        countParamIndex++;
      }

      if (filters.search) {
        countQuery += ` AND (s.name ILIKE $${countParamIndex} OR s.description ILIKE $${countParamIndex})`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);

      return {
        stages: result.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      throw error;
    }
  }

  // التحقق من وجود تذاكر في المرحلة
  static async hasTickets(stageId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM tickets WHERE current_stage_id = $1',
        [stageId]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  // جلب إحصائيات المرحلة
  static async getStats(stageId) {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(t.id) as total_tickets,
          COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_tickets,
          AVG(EXTRACT(EPOCH FROM (COALESCE(t.updated_at, NOW()) - t.created_at))/3600) as avg_time_hours
        FROM tickets t
        WHERE t.current_stage_id = $1
      `, [stageId]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // جلب المراحل حسب العملية
  static async findByProcessId(processId) {
    try {
      const result = await pool.query(`
        SELECT s.*, COUNT(t.id) as tickets_count
        FROM stages s
        LEFT JOIN tickets t ON s.id = t.current_stage_id
        WHERE s.process_id = $1
        GROUP BY s.id
        ORDER BY s.order_index, s.priority
      `, [processId]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // تحديث الانتقالات المسموحة للمرحلة
  static async updateAllowedTransitions(stageId, allowedTransitions) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // حذف جميع الانتقالات الحالية للمرحلة
      await client.query(
        'DELETE FROM stage_transitions WHERE from_stage_id = $1',
        [stageId]
      );

      // إضافة الانتقالات الجديدة
      if (allowedTransitions && allowedTransitions.length > 0) {
        for (let i = 0; i < allowedTransitions.length; i++) {
          const toStageId = allowedTransitions[i];

          // التحقق من وجود المرحلة المستهدفة
          const stageExists = await client.query(
            'SELECT id FROM stages WHERE id = $1',
            [toStageId]
          );

          if (stageExists.rows.length > 0) {
            await client.query(`
              INSERT INTO stage_transitions (
                from_stage_id, to_stage_id, transition_type,
                is_default, order_index, display_name
              )
              VALUES ($1, $2, 'manual', false, $3, $4)
            `, [
              stageId,
              toStageId,
              i + 1,
              `انتقال إلى المرحلة ${i + 1}`
            ]);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Stage;
