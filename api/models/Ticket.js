const { pool } = require('../config/database');

class Ticket {
  // إنشاء تذكرة جديدة
  static async create(ticketData) {
    const {
      title,
      description,
      process_id,
      assigned_to,
      created_by,
      priority = 'medium',
      due_date,
      data = {},
      parent_ticket_id,
      estimated_hours,
      tags = []
    } = ticketData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // توليد رقم التذكرة
      const ticketNumberQuery = `SELECT generate_ticket_number($1) as ticket_number`;
      const ticketNumberResult = await client.query(ticketNumberQuery, [process_id]);
      const ticket_number = ticketNumberResult.rows[0].ticket_number;

      // جلب المرحلة الأولى للعملية
      const initialStageQuery = `
        SELECT id FROM stages 
        WHERE process_id = $1 AND is_initial = true
        ORDER BY order_index, priority
        LIMIT 1
      `;
      const initialStageResult = await client.query(initialStageQuery, [process_id]);
      
      if (initialStageResult.rows.length === 0) {
        throw new Error('لا توجد مرحلة أولى محددة لهذه العملية');
      }

      const current_stage_id = initialStageResult.rows[0].id;

      // إنشاء التذكرة
      const ticketQuery = `
        INSERT INTO tickets (
          ticket_number, title, description, process_id, current_stage_id,
          assigned_to, created_by, priority, due_date, data, 
          parent_ticket_id, estimated_hours, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const ticketValues = [
        ticket_number,
        title,
        description,
        process_id,
        current_stage_id,
        assigned_to,
        created_by,
        priority,
        due_date,
        JSON.stringify(data),
        parent_ticket_id,
        estimated_hours,
        tags
      ];

      const ticketResult = await client.query(ticketQuery, ticketValues);
      const ticket = ticketResult.rows[0];

      // إضافة نشاط إنشاء التذكرة
      await this.addActivity(client, {
        ticket_id: ticket.id,
        user_id: created_by,
        activity_type: 'created',
        description: `تم إنشاء التذكرة ${ticket_number}`,
        new_values: { title, priority, assigned_to }
      });

      await client.query('COMMIT');

      return {
        ...ticket,
        data: ticket.data
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // جلب جميع التذاكر مع التصفية والبحث
  static async findAll(options = {}) {
    const {
      process_id,
      current_stage_id,
      assigned_to,
      created_by,
      priority,
      status = 'active',
      search,
      tags,
      due_date_from,
      due_date_to,
      limit = 50,
      offset = 0,
      order_by = 'created_at',
      order_direction = 'DESC'
    } = options;

    let query = `
      SELECT t.*, 
             p.name as process_name,
             p.color as process_color,
             s.name as stage_name,
             s.color as stage_color,
             u1.name as assigned_to_name,
             u2.name as created_by_name
      FROM tickets t
      JOIN processes p ON t.process_id = p.id
      JOIN stages s ON t.current_stage_id = s.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (process_id) {
      paramCount++;
      query += ` AND t.process_id = $${paramCount}`;
      values.push(process_id);
    }

    if (current_stage_id) {
      paramCount++;
      query += ` AND t.current_stage_id = $${paramCount}`;
      values.push(current_stage_id);
    }

    if (assigned_to) {
      paramCount++;
      query += ` AND t.assigned_to = $${paramCount}`;
      values.push(assigned_to);
    }

    if (created_by) {
      paramCount++;
      query += ` AND t.created_by = $${paramCount}`;
      values.push(created_by);
    }

    if (priority) {
      paramCount++;
      query += ` AND t.priority = $${paramCount}`;
      values.push(priority);
    }

    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      values.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount} OR t.ticket_number ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      query += ` AND t.tags && $${paramCount}`;
      values.push(tags);
    }

    if (due_date_from) {
      paramCount++;
      query += ` AND t.due_date >= $${paramCount}`;
      values.push(due_date_from);
    }

    if (due_date_to) {
      paramCount++;
      query += ` AND t.due_date <= $${paramCount}`;
      values.push(due_date_to);
    }

    query += ` ORDER BY t.${order_by} ${order_direction}`;

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
    return result.rows.map(ticket => ({
      ...ticket,
      data: ticket.data
    }));
  }

  // جلب تذكرة بالـ ID
  static async findById(id, options = {}) {
    const {
      include_activities = false,
      include_comments = false,
      include_attachments = false
    } = options;

    const query = `
      SELECT t.*, 
             p.name as process_name,
             p.color as process_color,
             p.icon as process_icon,
             s.name as stage_name,
             s.color as stage_color,
             s.is_final as stage_is_final,
             u1.name as assigned_to_name,
             u1.email as assigned_to_email,
             u2.name as created_by_name,
             u2.email as created_by_email
      FROM tickets t
      JOIN processes p ON t.process_id = p.id
      JOIN stages s ON t.current_stage_id = s.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const ticket = {
      ...result.rows[0],
      data: result.rows[0].data
    };

    // إضافة الأنشطة
    if (include_activities) {
      ticket.activities = await this.getActivities(id);
    }

    // إضافة التعليقات
    if (include_comments) {
      ticket.comments = await this.getComments(id);
    }

    // إضافة المرفقات
    if (include_attachments) {
      ticket.attachments = await this.getAttachments(id);
    }

    return ticket;
  }

  // تحديث تذكرة
  static async update(id, updateData, userId) {
    const {
      title,
      description,
      assigned_to,
      priority,
      due_date,
      data,
      estimated_hours,
      actual_hours,
      tags
    } = updateData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // جلب البيانات الحالية للمقارنة
      const currentQuery = `SELECT * FROM tickets WHERE id = $1`;
      const currentResult = await client.query(currentQuery, [id]);
      const currentTicket = currentResult.rows[0];

      if (!currentTicket) {
        throw new Error('التذكرة غير موجودة');
      }

      const fields = [];
      const values = [];
      let paramCount = 0;
      const changes = {};
      const oldValues = {};

      if (title !== undefined && title !== currentTicket.title) {
        paramCount++;
        fields.push(`title = $${paramCount}`);
        values.push(title);
        changes.title = title;
        oldValues.title = currentTicket.title;
      }

      if (description !== undefined && description !== currentTicket.description) {
        paramCount++;
        fields.push(`description = $${paramCount}`);
        values.push(description);
        changes.description = description;
        oldValues.description = currentTicket.description;
      }

      if (assigned_to !== undefined && assigned_to !== currentTicket.assigned_to) {
        paramCount++;
        fields.push(`assigned_to = $${paramCount}`);
        values.push(assigned_to);
        changes.assigned_to = assigned_to;
        oldValues.assigned_to = currentTicket.assigned_to;
      }

      if (priority !== undefined && priority !== currentTicket.priority) {
        paramCount++;
        fields.push(`priority = $${paramCount}`);
        values.push(priority);
        changes.priority = priority;
        oldValues.priority = currentTicket.priority;
      }

      if (due_date !== undefined && due_date !== currentTicket.due_date) {
        paramCount++;
        fields.push(`due_date = $${paramCount}`);
        values.push(due_date);
        changes.due_date = due_date;
        oldValues.due_date = currentTicket.due_date;
      }

      if (data !== undefined) {
        paramCount++;
        fields.push(`data = $${paramCount}`);
        values.push(JSON.stringify(data));
        changes.data = data;
        oldValues.data = currentTicket.data;
      }

      if (estimated_hours !== undefined && estimated_hours !== currentTicket.estimated_hours) {
        paramCount++;
        fields.push(`estimated_hours = $${paramCount}`);
        values.push(estimated_hours);
        changes.estimated_hours = estimated_hours;
        oldValues.estimated_hours = currentTicket.estimated_hours;
      }

      if (actual_hours !== undefined && actual_hours !== currentTicket.actual_hours) {
        paramCount++;
        fields.push(`actual_hours = $${paramCount}`);
        values.push(actual_hours);
        changes.actual_hours = actual_hours;
        oldValues.actual_hours = currentTicket.actual_hours;
      }

      if (tags !== undefined) {
        paramCount++;
        fields.push(`tags = $${paramCount}`);
        values.push(tags);
        changes.tags = tags;
        oldValues.tags = currentTicket.tags;
      }

      if (fields.length === 0) {
        await client.query('ROLLBACK');
        return currentTicket;
      }

      paramCount++;
      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      paramCount++;
      values.push(id);

      const query = `
        UPDATE tickets 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedTicket = result.rows[0];

      // إضافة نشاط التحديث
      await this.addActivity(client, {
        ticket_id: id,
        user_id: userId,
        activity_type: 'updated',
        description: 'تم تحديث التذكرة',
        old_values: oldValues,
        new_values: changes
      });

      await client.query('COMMIT');

      return {
        ...updatedTicket,
        data: updatedTicket.data
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // تغيير مرحلة التذكرة
  static async changeStage(ticketId, newStageId, userId, comment = null) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // جلب التذكرة الحالية
      const ticketQuery = `SELECT * FROM tickets WHERE id = $1`;
      const ticketResult = await client.query(ticketQuery, [ticketId]);
      const ticket = ticketResult.rows[0];

      if (!ticket) {
        throw new Error('التذكرة غير موجودة');
      }

      // التحقق من إمكانية الانتقال (مبسط للآن)
      // يمكن إضافة منطق أكثر تعقيداً لاحقاً
      const stageQuery = `SELECT * FROM stages WHERE id = $1`;
      const stageResult = await client.query(stageQuery, [newStageId]);

      if (stageResult.rows.length === 0) {
        throw new Error('المرحلة المستهدفة غير موجودة');
      }

      // استخدام نتيجة الاستعلام السابق
      const newStage = stageResult.rows[0];

      // تحديث التذكرة
      const updateQuery = `
        UPDATE tickets 
        SET current_stage_id = $1, 
            updated_at = NOW(),
            ${newStage.is_final ? 'status = \'completed\', completed_at = NOW()' : ''}
        WHERE id = $2
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [newStageId, ticketId]);
      const updatedTicket = updateResult.rows[0];

      // إضافة نشاط تغيير المرحلة
      await this.addActivity(client, {
        ticket_id: ticketId,
        user_id: userId,
        activity_type: 'stage_changed',
        description: `تم نقل التذكرة إلى مرحلة "${newStage.name}"`,
        old_values: { stage_id: ticket.current_stage_id },
        new_values: { stage_id: newStageId }
      });

      // إضافة تعليق إذا تم تقديمه
      if (comment) {
        await this.addComment(client, {
          ticket_id: ticketId,
          user_id: userId,
          content: comment,
          is_internal: false
        });
      }

      await client.query('COMMIT');

      return {
        ...updatedTicket,
        data: updatedTicket.data
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // إضافة نشاط للتذكرة
  static async addActivity(client, activityData) {
    const {
      ticket_id,
      user_id,
      activity_type,
      description,
      old_values = {},
      new_values = {},
      metadata = {},
      ip_address,
      user_agent
    } = activityData;

    const query = `
      INSERT INTO ticket_activities (
        ticket_id, user_id, activity_type, description,
        old_values, new_values, metadata, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      ticket_id,
      user_id,
      activity_type,
      description,
      JSON.stringify(old_values),
      JSON.stringify(new_values),
      JSON.stringify(metadata),
      ip_address,
      user_agent
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  // جلب أنشطة التذكرة
  static async getActivities(ticketId, limit = 50) {
    const query = `
      SELECT ta.*, u.name as user_name, u.email as user_email
      FROM ticket_activities ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.ticket_id = $1
      ORDER BY ta.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [ticketId, limit]);
    return result.rows.map(activity => ({
      ...activity,
      old_values: activity.old_values,
      new_values: activity.new_values,
      metadata: activity.metadata
    }));
  }

  // إضافة تعليق
  static async addComment(client, commentData) {
    const {
      ticket_id,
      user_id,
      content,
      is_internal = false,
      parent_comment_id,
      attachments = []
    } = commentData;

    const query = `
      INSERT INTO ticket_comments (
        ticket_id, user_id, content, is_internal, parent_comment_id, attachments
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      ticket_id,
      user_id,
      content,
      is_internal,
      parent_comment_id,
      JSON.stringify(attachments)
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  // جلب تعليقات التذكرة
  static async getComments(ticketId, includeInternal = true) {
    let query = `
      SELECT
        tc.*,
        u.name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = $1
    `;

    if (!includeInternal) {
      query += ` AND tc.is_internal = false`;
    }

    query += ` ORDER BY tc.created_at DESC`;

    const result = await pool.query(query, [ticketId]);
    return result.rows.map(comment => ({
      ...comment,
      attachments: comment.attachments || []
    }));
  }

  // جلب مرفقات التذكرة
  static async getAttachments(ticketId) {
    const query = `
      SELECT ta.*, u.name as uploaded_by_name
      FROM ticket_attachments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.ticket_id = $1
      ORDER BY ta.created_at DESC
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // جلب جميع التذاكر مع التصفية
  static async findAll(filters = {}, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT t.*,
               p.name as process_name,
               s.name as stage_name,
               s.color as stage_color,
               u1.name as created_by_name,
               u2.name as assigned_to_name
        FROM tickets t
        LEFT JOIN processes p ON t.process_id = p.id
        LEFT JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (filters.process_id) {
        query += ` AND t.process_id = $${paramIndex}`;
        params.push(filters.process_id);
        paramIndex++;
      }

      if (filters.current_stage_id) {
        query += ` AND t.current_stage_id = $${paramIndex}`;
        params.push(filters.current_stage_id);
        paramIndex++;
      }

      if (filters.assigned_to) {
        query += ` AND t.assigned_to = $${paramIndex}`;
        params.push(filters.assigned_to);
        paramIndex++;
      }

      if (filters.priority) {
        query += ` AND t.priority = $${paramIndex}`;
        params.push(filters.priority);
        paramIndex++;
      }

      if (filters.status) {
        query += ` AND t.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.search) {
        query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex} OR t.ticket_number ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.due_date_from) {
        query += ` AND t.due_date >= $${paramIndex}`;
        params.push(filters.due_date_from);
        paramIndex++;
      }

      if (filters.due_date_to) {
        query += ` AND t.due_date <= $${paramIndex}`;
        params.push(filters.due_date_to);
        paramIndex++;
      }

      query += ` ORDER BY t.created_at DESC`;

      // إضافة LIMIT و OFFSET
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // جلب العدد الإجمالي
      let countQuery = `
        SELECT COUNT(*) as total
        FROM tickets t
        WHERE 1=1
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (filters.process_id) {
        countQuery += ` AND t.process_id = $${countParamIndex}`;
        countParams.push(filters.process_id);
        countParamIndex++;
      }

      if (filters.current_stage_id) {
        countQuery += ` AND t.current_stage_id = $${countParamIndex}`;
        countParams.push(filters.current_stage_id);
        countParamIndex++;
      }

      if (filters.assigned_to) {
        countQuery += ` AND t.assigned_to = $${countParamIndex}`;
        countParams.push(filters.assigned_to);
        countParamIndex++;
      }

      if (filters.priority) {
        countQuery += ` AND t.priority = $${countParamIndex}`;
        countParams.push(filters.priority);
        countParamIndex++;
      }

      if (filters.status) {
        countQuery += ` AND t.status = $${countParamIndex}`;
        countParams.push(filters.status);
        countParamIndex++;
      }

      if (filters.search) {
        countQuery += ` AND (t.title ILIKE $${countParamIndex} OR t.description ILIKE $${countParamIndex} OR t.ticket_number ILIKE $${countParamIndex})`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }

      if (filters.due_date_from) {
        countQuery += ` AND t.due_date >= $${countParamIndex}`;
        countParams.push(filters.due_date_from);
        countParamIndex++;
      }

      if (filters.due_date_to) {
        countQuery += ` AND t.due_date <= $${countParamIndex}`;
        countParams.push(filters.due_date_to);
        countParamIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);

      return {
        tickets: result.rows.map(ticket => ({
          ...ticket,
          data: ticket.data
        })),
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      throw error;
    }
  }

  // حذف تذكرة مؤقت (soft delete)
  static async softDelete(id, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(`
        UPDATE tickets
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      `, [id]);

      if (result.rows.length > 0) {
        // إضافة نشاط الحذف
        await this.addActivity(client, {
          ticket_id: id,
          user_id: userId,
          activity_type: 'status_changed',
          description: 'تم حذف التذكرة مؤقتاً',
          new_values: { deleted_at: new Date().toISOString() }
        });
      }

      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // حذف تذكرة نهائي (permanent delete)
  static async permanentDelete(id, userId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // التحقق من وجود التذكرة
      const ticketCheck = await client.query(`
        SELECT * FROM tickets WHERE id = $1
      `, [id]);

      if (ticketCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const ticket = ticketCheck.rows[0];

      // حذف التعليقات أولاً
      await client.query(`DELETE FROM ticket_comments WHERE ticket_id = $1`, [id]);

      // حذف المرفقات
      await client.query(`DELETE FROM ticket_attachments WHERE ticket_id = $1`, [id]);

      // حذف الأنشطة
      await client.query(`DELETE FROM ticket_activities WHERE ticket_id = $1`, [id]);

      // حذف التذكرة نهائياً
      const result = await client.query(`
        DELETE FROM tickets WHERE id = $1 RETURNING *
      `, [id]);

      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // التحقق من وجود تعليقات
  static async hasComments(ticketId) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM ticket_comments WHERE ticket_id = $1
      `, [ticketId]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  // التحقق من وجود مرفقات
  static async hasAttachments(ticketId) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM ticket_attachments WHERE ticket_id = $1
      `, [ticketId]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw error;
    }
  }

  // تحريك التذكرة إلى مرحلة جديدة (محسن)
  static async moveToStage(ticketId, targetStageId, userId, options = {}) {
    const {
      comment = null,
      validate_transitions = true,
      notify_assignee = true
    } = options;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // جلب التذكرة الحالية
      const ticketQuery = `
        SELECT t.*, p.name as process_name, s.name as current_stage_name
        FROM tickets t
        JOIN processes p ON t.process_id = p.id
        JOIN stages s ON t.current_stage_id = s.id
        WHERE t.id = $1 AND t.deleted_at IS NULL
      `;
      const ticketResult = await client.query(ticketQuery, [ticketId]);

      if (ticketResult.rows.length === 0) {
        throw new Error('التذكرة غير موجودة');
      }

      const ticket = ticketResult.rows[0];

      // جلب المرحلة المستهدفة
      const targetStageQuery = `
        SELECT * FROM stages WHERE id = $1 AND process_id = $2
      `;
      const targetStageResult = await client.query(targetStageQuery, [targetStageId, ticket.process_id]);

      if (targetStageResult.rows.length === 0) {
        throw new Error('المرحلة المستهدفة غير موجودة أو لا تنتمي لنفس العملية');
      }

      const targetStage = targetStageResult.rows[0];

      // التحقق من صحة الانتقال إذا كان مطلوباً
      if (validate_transitions) {
        const transitionQuery = `
          SELECT * FROM stage_transitions
          WHERE from_stage_id = $1 AND to_stage_id = $2
        `;
        const transitionResult = await client.query(transitionQuery, [ticket.current_stage_id, targetStageId]);

        if (transitionResult.rows.length === 0) {
          throw new Error('الانتقال من المرحلة الحالية إلى المرحلة المستهدفة غير مسموح');
        }
      }

      // تحديث التذكرة
      const updateQuery = `
        UPDATE tickets
        SET current_stage_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [targetStageId, ticketId]);
      const updatedTicket = updateResult.rows[0];

      // إضافة نشاط تغيير المرحلة
      await this.addActivity(client, {
        ticket_id: ticketId,
        user_id: userId,
        activity_type: 'stage_changed',
        description: `تم نقل التذكرة من "${ticket.current_stage_name}" إلى "${targetStage.name}"`,
        old_values: {
          stage_id: ticket.current_stage_id,
          stage_name: ticket.current_stage_name
        },
        new_values: {
          stage_id: targetStageId,
          stage_name: targetStage.name
        }
      });

      // إضافة تعليق إذا تم تقديمه
      if (comment) {
        await this.addComment(client, {
          ticket_id: ticketId,
          user_id: userId,
          content: comment,
          is_internal: false
        });
      }

      await client.query('COMMIT');

      return {
        ...updatedTicket,
        data: updatedTicket.data,
        stage_info: {
          previous_stage: {
            id: ticket.current_stage_id,
            name: ticket.current_stage_name
          },
          current_stage: {
            id: targetStageId,
            name: targetStage.name
          }
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // تعيين التذكرة لمستخدم
  static async assign(ticketId, assignedTo, userId) {
    try {
      const result = await pool.query(`
        UPDATE tickets
        SET assigned_to = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [assignedTo, ticketId]);

      if (result.rows.length > 0) {
        // إضافة نشاط التعيين
        await this.addActivity(pool, {
          ticket_id: ticketId,
          user_id: userId,
          activity_type: 'assigned',
          description: `تم تعيين التذكرة للمستخدم`,
          new_values: { assigned_to: assignedTo }
        });
      }

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // جلب إحصائيات التذاكر
  static async getStats(filters = {}) {
    try {
      let query = `
        SELECT
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tickets,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tickets,
          COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_tickets,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
          COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
          COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tickets,
          AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))/3600) as avg_resolution_hours
        FROM tickets t
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (filters.process_id) {
        query += ` AND t.process_id = $${paramIndex}`;
        params.push(filters.process_id);
        paramIndex++;
      }

      if (filters.assigned_to) {
        query += ` AND t.assigned_to = $${paramIndex}`;
        params.push(filters.assigned_to);
        paramIndex++;
      }

      if (filters.date_from) {
        query += ` AND t.created_at >= $${paramIndex}`;
        params.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        query += ` AND t.created_at <= $${paramIndex}`;
        params.push(filters.date_to);
        paramIndex++;
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // البحث في التذاكر
  static async search(searchTerm, filters = {}, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT t.*,
               p.name as process_name,
               s.name as stage_name,
               s.color as stage_color,
               u1.name as created_by_name,
               u2.name as assigned_to_name,
               ts_rank(to_tsvector('arabic', t.title || ' ' || COALESCE(t.description, '')), plainto_tsquery('arabic', $1)) as rank
        FROM tickets t
        LEFT JOIN processes p ON t.process_id = p.id
        LEFT JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE 1=1
        AND (
          to_tsvector('arabic', t.title || ' ' || COALESCE(t.description, '')) @@ plainto_tsquery('arabic', $1)
          OR t.ticket_number ILIKE $2
          OR t.title ILIKE $2
          OR t.description ILIKE $2
        )
      `;

      const params = [searchTerm, `%${searchTerm}%`];
      let paramIndex = 3;

      if (filters.process_id) {
        query += ` AND t.process_id = $${paramIndex}`;
        params.push(filters.process_id);
        paramIndex++;
      }

      if (filters.status) {
        query += ` AND t.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.priority) {
        query += ` AND t.priority = $${paramIndex}`;
        params.push(filters.priority);
        paramIndex++;
      }

      query += ` ORDER BY rank DESC, t.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // جلب العدد الإجمالي للبحث
      let countQuery = `
        SELECT COUNT(*) as total
        FROM tickets t
        WHERE 1=1
        AND (
          to_tsvector('arabic', t.title || ' ' || COALESCE(t.description, '')) @@ plainto_tsquery('arabic', $1)
          OR t.ticket_number ILIKE $2
          OR t.title ILIKE $2
          OR t.description ILIKE $2
        )
      `;

      const countParams = [searchTerm, `%${searchTerm}%`];
      let countParamIndex = 3;

      if (filters.process_id) {
        countQuery += ` AND t.process_id = $${countParamIndex}`;
        countParams.push(filters.process_id);
        countParamIndex++;
      }

      if (filters.status) {
        countQuery += ` AND t.status = $${countParamIndex}`;
        countParams.push(filters.status);
        countParamIndex++;
      }

      if (filters.priority) {
        countQuery += ` AND t.priority = $${countParamIndex}`;
        countParams.push(filters.priority);
        countParamIndex++;
      }

      const countResult = await pool.query(countQuery, countParams);

      return {
        tickets: result.rows.map(ticket => ({
          ...ticket,
          data: ticket.data
        })),
        total: parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      throw error;
    }
  }

  // جلب التذاكر مجمعة حسب المراحل
  static async findByStages(processId, stageIds, options = {}) {
    try {
      const {
        assigned_to,
        priority,
        status = 'active',
        search,
        due_date_from,
        due_date_to,
        limit = 100,
        order_by = 'created_at',
        order_direction = 'DESC'
      } = options;

      // التحقق من المعاملات المطلوبة
      if (!processId) {
        throw new Error('معرف العملية مطلوب');
      }

      if (!stageIds || !Array.isArray(stageIds) || stageIds.length === 0) {
        throw new Error('معرفات المراحل مطلوبة ويجب أن تكون مصفوفة غير فارغة');
      }

      // بناء الاستعلام الأساسي
      let query = `
        SELECT t.*,
               p.name as process_name,
               p.color as process_color,
               p.icon as process_icon,
               s.name as stage_name,
               s.color as stage_color,
               s.is_final as stage_is_final,
               s.priority as stage_priority,
               u1.name as assigned_to_name,
               u1.email as assigned_to_email,
               u2.name as created_by_name,
               u2.email as created_by_email
        FROM tickets t
        JOIN processes p ON t.process_id = p.id
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.process_id = $1
        AND t.current_stage_id = ANY($2)
      `;

      const params = [processId, stageIds];
      let paramIndex = 3;

      // إضافة فلاتر إضافية
      if (assigned_to) {
        query += ` AND t.assigned_to = $${paramIndex}`;
        params.push(assigned_to);
        paramIndex++;
      }

      if (priority) {
        query += ` AND t.priority = $${paramIndex}`;
        params.push(priority);
        paramIndex++;
      }

      if (status) {
        query += ` AND t.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        query += ` AND (
          t.title ILIKE $${paramIndex} OR
          t.description ILIKE $${paramIndex} OR
          t.ticket_number ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (due_date_from) {
        query += ` AND t.due_date >= $${paramIndex}`;
        params.push(due_date_from);
        paramIndex++;
      }

      if (due_date_to) {
        query += ` AND t.due_date <= $${paramIndex}`;
        params.push(due_date_to);
        paramIndex++;
      }

      // ترتيب النتائج
      const validOrderColumns = ['created_at', 'updated_at', 'title', 'priority', 'due_date'];
      const orderColumn = validOrderColumns.includes(order_by) ? order_by : 'created_at';
      const orderDir = order_direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      query += ` ORDER BY t.${orderColumn} ${orderDir}`;

      // إضافة حد أقصى للنتائج
      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(parseInt(limit));
      }

      // تنفيذ الاستعلام
      const result = await pool.query(query, params);

      // تجميع النتائج حسب المرحلة
      const ticketsByStage = {};

      // تهيئة جميع المراحل المطلوبة بمصفوفات فارغة
      stageIds.forEach(stageId => {
        ticketsByStage[stageId] = [];
      });

      // تجميع التذاكر حسب المرحلة
      result.rows.forEach(ticket => {
        const stageId = ticket.current_stage_id;
        if (ticketsByStage[stageId]) {
          ticketsByStage[stageId].push({
            ...ticket,
            data: ticket.data
          });
        }
      });

      // حساب الإحصائيات
      const totalTickets = result.rows.length;
      const stageStats = {};

      Object.keys(ticketsByStage).forEach(stageId => {
        stageStats[stageId] = {
          count: ticketsByStage[stageId].length,
          stage_name: ticketsByStage[stageId][0]?.stage_name || null,
          stage_color: ticketsByStage[stageId][0]?.stage_color || null
        };
      });

      return {
        tickets_by_stage: ticketsByStage,
        statistics: {
          total_tickets: totalTickets,
          stage_stats: stageStats,
          process_id: processId,
          stage_ids: stageIds
        }
      };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = Ticket;
