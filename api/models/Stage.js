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
      settings = {}
    } = stageData;

    // التحقق من عدم تكرار الترتيب أو الأولوية
    const checkQuery = `
      SELECT id FROM stages 
      WHERE process_id = $1 AND (order_index = $2 OR priority = $3)
    `;
    const checkResult = await pool.query(checkQuery, [process_id, order_index, priority]);
    
    if (checkResult.rows.length > 0) {
      // إعادة ترتيب المراحل الموجودة
      await this.reorderStages(process_id);
      
      // الحصول على الترتيب والأولوية التالية
      const nextOrderQuery = `
        SELECT COALESCE(MAX(order_index), 0) + 1 as next_order,
               COALESCE(MAX(priority), 0) + 1 as next_priority
        FROM stages WHERE process_id = $1
      `;
      const nextOrderResult = await pool.query(nextOrderQuery, [process_id]);
      const { next_order, next_priority } = nextOrderResult.rows[0];
      
      stageData.order_index = order_index || next_order;
      stageData.priority = priority || next_priority;
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
    return result.rows[0];
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
      settings
    } = updateData;

    const fields = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
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
    return result.rows[0];
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
}

module.exports = Stage;
