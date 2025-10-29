const { pool } = require('../config/database');

class RecurringTicket {
  // إنشاء قاعدة تكرار جديدة
  static async create(data) {
    const {
      rule_name,
      title,
      description,
      process_id,
      current_stage_id,
      created_by,
      priority = 'medium',
      status = 'active',
      due_date,
      data: ticketData = {},
      tags = [],
      process_name,
      stage_name,
      created_by_name,
      assigned_to_name,
      assigned_to_id,
      recurrence_type,
      recurrence_count = 1,
      start_date,
      is_active = true
    } = data;

    const query = `
      INSERT INTO recurring_tickets (
        rule_name, title, description, process_id, current_stage_id, created_by,
        priority, status, due_date, data, tags, process_name, stage_name, 
        created_by_name, assigned_to_name, assigned_to_id, recurrence_type, 
        recurrence_count, start_date, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      rule_name, title, description, process_id, current_stage_id, created_by,
      priority, status, due_date, JSON.stringify(ticketData), tags, process_name, 
      stage_name, created_by_name, assigned_to_name, assigned_to_id, recurrence_type, 
      recurrence_count, start_date, is_active
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // جلب جميع القواعد
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM recurring_tickets WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.is_active);
    }

    if (filters.process_id) {
      paramCount++;
      query += ` AND process_id = $${paramCount}`;
      values.push(filters.process_id);
    }

    if (filters.recurrence_type) {
      paramCount++;
      query += ` AND recurrence_type = $${paramCount}`;
      values.push(filters.recurrence_type);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  // جلب قاعدة واحدة بالمعرف
  static async findById(id) {
    const query = 'SELECT * FROM recurring_tickets WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // تحديث قاعدة
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    // بناء الاستعلام ديناميكياً
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        if (key === 'data') {
          values.push(JSON.stringify(data[key]));
        } else {
          values.push(data[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('لا توجد حقول للتحديث');
    }

    // إضافة updated_at
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // إضافة معرف السجل
    paramCount++;
    values.push(id);

    const query = `
      UPDATE recurring_tickets 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // حذف قاعدة
  static async delete(id) {
    const query = 'DELETE FROM recurring_tickets WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // تفعيل/إلغاء تفعيل قاعدة
  static async toggleActive(id) {
    const query = `
      UPDATE recurring_tickets 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // جلب القواعد النشطة
  static async findActive() {
    const query = `
      SELECT * FROM recurring_tickets 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = RecurringTicket;
