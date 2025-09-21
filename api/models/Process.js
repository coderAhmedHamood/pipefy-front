const { pool } = require('../config/database');

class Process {
  // إنشاء عملية جديدة
  static async create(processData) {
    const {
      name,
      description,
      color = '#3B82F6',
      icon = 'FolderOpen',
      settings = {},
      created_by
    } = processData;

    const query = `
      INSERT INTO processes (name, description, color, icon, settings, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [name, description, color, icon, JSON.stringify(settings), created_by];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // جلب جميع العمليات
  static async findAll(options = {}) {
    const {
      include_stages = false,
      include_fields = false,
      include_transitions = false,
      is_active = true,
      created_by = null,
      limit = 50,
      offset = 0
    } = options;

    let query = `
      SELECT p.*, 
             u.name as created_by_name,
             COUNT(t.id) as tickets_count
      FROM processes p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tickets t ON p.id = t.process_id
      WHERE p.deleted_at IS NULL
    `;

    const values = [];
    let paramCount = 0;

    if (is_active !== null) {
      paramCount++;
      query += ` AND p.is_active = $${paramCount}`;
      values.push(is_active);
    }

    if (created_by) {
      paramCount++;
      query += ` AND p.created_by = $${paramCount}`;
      values.push(created_by);
    }

    query += ` GROUP BY p.id, u.name ORDER BY p.created_at DESC`;

    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
    }

    if (offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);
    }

    const result = await pool.query(query, values);
    const processes = result.rows;

    // إضافة المراحل والحقول إذا طُلب ذلك
    if (include_stages || include_fields) {
      for (let process of processes) {
        if (include_stages) {
          process.stages = await this.getStages(process.id, include_transitions);
        }
        if (include_fields) {
          process.fields = await this.getFields(process.id);
        }
      }
    }

    return processes;
  }

  // جلب عملية بالـ ID
  static async findById(id, options = {}) {
    const {
      include_stages = false,
      include_fields = false,
      include_transitions = false
    } = options;

    const query = `
      SELECT p.*, 
             u.name as created_by_name,
             COUNT(t.id) as tickets_count
      FROM processes p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tickets t ON p.id = t.process_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, u.name
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const process = result.rows[0];

    // إضافة المراحل والحقول والانتقالات
    if (include_stages) {
      process.stages = await this.getStages(id, include_transitions);
    }
    if (include_fields) {
      process.fields = await this.getFields(id);
    }

    return process;
  }

  // تحديث عملية
  static async update(id, updateData) {
    const {
      name,
      description,
      color,
      icon,
      is_active,
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

    if (icon !== undefined) {
      paramCount++;
      fields.push(`icon = $${paramCount}`);
      values.push(icon);
    }

    if (is_active !== undefined) {
      paramCount++;
      fields.push(`is_active = $${paramCount}`);
      values.push(is_active);
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
      UPDATE processes 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // حذف عملية (Soft Delete)
  static async delete(id) {
    const query = `
      UPDATE processes 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // جلب مراحل العملية
  static async getStages(processId, includeTransitions = false) {
    const query = `
      SELECT s.*,
             COUNT(t.id) as tickets_count
      FROM stages s
      LEFT JOIN tickets t ON s.id = t.current_stage_id
      WHERE s.process_id = $1
      GROUP BY s.id
      ORDER BY s.order_index, s.priority
    `;

    const result = await pool.query(query, [processId]);
    const stages = result.rows;

    if (includeTransitions) {
      for (let stage of stages) {
        stage.transitions = await this.getStageTransitions(stage.id);
      }
    }

    return stages;
  }

  // جلب حقول العملية
  static async getFields(processId) {
    const query = `
      SELECT *
      FROM process_fields
      WHERE process_id = $1
      ORDER BY order_index
    `;

    const result = await pool.query(query, [processId]);
    return result.rows.map(field => ({
      ...field,
      default_value: field.default_value,
      options: field.options,
      validation_rules: field.validation_rules
    }));
  }

  // جلب انتقالات المرحلة
  static async getStageTransitions(stageId) {
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

  // إنشاء عملية مع مراحل افتراضية
  static async createWithDefaultStages(processData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // إنشاء العملية
      const processQuery = `
        INSERT INTO processes (name, description, color, icon, settings, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const processValues = [
        processData.name,
        processData.description,
        processData.color || '#3B82F6',
        processData.icon || 'FolderOpen',
        JSON.stringify(processData.settings || {}),
        processData.created_by
      ];
      const processResult = await client.query(processQuery, processValues);
      const process = processResult.rows[0];

      // إنشاء المراحل الافتراضية
      const stageQueries = [
        {
          name: 'مرحلة جديدة',
          description: 'المرحلة الأولى للعملية',
          color: '#6B7280',
          order_index: 1,
          priority: 1,
          is_initial: true
        },
        {
          name: 'قيد المراجعة',
          description: 'مرحلة مراجعة الطلب',
          color: '#F59E0B',
          order_index: 2,
          priority: 2
        },
        {
          name: 'مكتملة',
          description: 'المرحلة النهائية',
          color: '#10B981',
          order_index: 3,
          priority: 3,
          is_final: true
        }
      ];

      const createdStages = [];
      for (let stageData of stageQueries) {
        const stageQuery = `
          INSERT INTO stages (process_id, name, description, color, order_index, priority, is_initial, is_final)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        const stageValues = [
          process.id,
          stageData.name,
          stageData.description,
          stageData.color,
          stageData.order_index,
          stageData.priority,
          stageData.is_initial || false,
          stageData.is_final || false
        ];
        const stageResult = await client.query(stageQuery, stageValues);
        createdStages.push(stageResult.rows[0]);
      }

      // إنشاء انتقالات افتراضية
      const transitionQueries = [
        {
          from_stage_id: createdStages[0].id,
          to_stage_id: createdStages[1].id,
          display_name: 'إرسال للمراجعة',
          is_default: true,
          order_index: 1
        },
        {
          from_stage_id: createdStages[1].id,
          to_stage_id: createdStages[2].id,
          display_name: 'موافقة',
          is_default: true,
          order_index: 1
        },
        {
          from_stage_id: createdStages[1].id,
          to_stage_id: createdStages[0].id,
          display_name: 'رفض',
          button_color: '#EF4444',
          order_index: 2
        }
      ];

      for (let transitionData of transitionQueries) {
        const transitionQuery = `
          INSERT INTO stage_transitions (from_stage_id, to_stage_id, display_name, is_default, button_color, order_index)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const transitionValues = [
          transitionData.from_stage_id,
          transitionData.to_stage_id,
          transitionData.display_name,
          transitionData.is_default || false,
          transitionData.button_color || '#3B82F6',
          transitionData.order_index
        ];
        await client.query(transitionQuery, transitionValues);
      }

      await client.query('COMMIT');

      // إرجاع العملية مع المراحل
      process.stages = createdStages;
      return process;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // جلب إحصائيات العملية
  static async getStats(processId) {
    const query = `
      SELECT 
        COUNT(t.id) as total_tickets,
        COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_tickets,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
        COUNT(CASE WHEN t.due_date < NOW() AND t.status = 'active' THEN 1 END) as overdue_tickets,
        AVG(CASE WHEN t.completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600 
            END) as avg_completion_hours,
        COUNT(DISTINCT t.assigned_to) as unique_assignees,
        COUNT(DISTINCT s.id) as total_stages
      FROM processes p
      LEFT JOIN tickets t ON p.id = t.process_id
      LEFT JOIN stages s ON p.id = s.process_id
      WHERE p.id = $1
      GROUP BY p.id
    `;

    const result = await pool.query(query, [processId]);
    return result.rows[0] || {};
  }
}

module.exports = Process;
