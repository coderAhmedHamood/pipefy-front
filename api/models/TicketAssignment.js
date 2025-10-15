const { pool } = require('../config/database');

class TicketAssignment {
  // إنشاء جدول ticket_assignments تلقائياً
  static async ensureTable() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ticket_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assigned_by UUID REFERENCES users(id),
          role VARCHAR(100),
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(ticket_id, user_id)
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket ON ticket_assignments(ticket_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_assignments_user ON ticket_assignments(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ticket_assignments_active ON ticket_assignments(is_active);`);
    } finally {
      client.release();
    }
  }

  // إضافة مستخدم مُسند إلى تذكرة
  static async create(assignmentData) {
    const {
      ticket_id,
      user_id,
      assigned_by,
      role,
      notes
    } = assignmentData;

    const query = `
      INSERT INTO ticket_assignments 
      (ticket_id, user_id, assigned_by, role, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      ticket_id,
      user_id,
      assigned_by,
      role,
      notes
    ]);

    return result.rows[0];
  }

  // جلب جميع المستخدمين المُسندة إليهم تذكرة معينة
  static async findByTicket(ticketId) {
    const query = `
      SELECT 
        ta.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        ab.name as assigned_by_name
      FROM ticket_assignments ta
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN users ab ON ta.assigned_by = ab.id
      WHERE ta.ticket_id = $1 AND ta.is_active = true
      ORDER BY ta.assigned_at DESC
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // جلب جميع التذاكر المُسندة لمستخدم معين
  static async findByUser(userId, options = {}) {
    const { is_active = true, limit = 100, offset = 0 } = options;

    let query = `
      SELECT 
        ta.*,
        t.title as ticket_title,
        t.ticket_number,
        t.status as ticket_status,
        t.priority,
        p.name as process_name
      FROM ticket_assignments ta
      LEFT JOIN tickets t ON ta.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE ta.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (is_active !== null) {
      query += ` AND ta.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    query += ` ORDER BY ta.assigned_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // تحديث إسناد
  static async update(id, updateData) {
    const { role, notes, is_active } = updateData;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ticket_assignments 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // حذف إسناد (soft delete)
  static async delete(id) {
    const query = `
      UPDATE ticket_assignments 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // حذف إسناد (hard delete)
  static async hardDelete(id) {
    const query = `DELETE FROM ticket_assignments WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // حذف جميع الإسنادات لتذكرة معينة
  static async deleteByTicket(ticketId) {
    const query = `
      UPDATE ticket_assignments 
      SET is_active = false, updated_at = NOW()
      WHERE ticket_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // التحقق من وجود إسناد نشط
  static async exists(ticketId, userId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM ticket_assignments 
        WHERE ticket_id = $1 AND user_id = $2 AND is_active = true
      ) as exists
    `;

    const result = await pool.query(query, [ticketId, userId]);
    return result.rows[0].exists;
  }

  // البحث عن إسناد موجود (حتى لو غير نشط)
  static async findExisting(ticketId, userId) {
    const query = `
      SELECT * FROM ticket_assignments 
      WHERE ticket_id = $1 AND user_id = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [ticketId, userId]);
    return result.rows[0] || null;
  }

  // إعادة تفعيل إسناد محذوف
  static async reactivate(id, updateData = {}) {
    const { assigned_by, role, notes } = updateData;
    
    const updates = ['is_active = true'];
    const values = [];
    let paramIndex = 1;

    if (assigned_by) {
      updates.push(`assigned_by = $${paramIndex}`);
      values.push(assigned_by);
      paramIndex++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    updates.push(`assigned_at = NOW()`, `updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ticket_assignments 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // جلب إحصائيات الإسناد لتذكرة
  static async getTicketStats(ticketId) {
    const query = `
      SELECT 
        COUNT(*) as total_assigned,
        COUNT(DISTINCT role) as unique_roles,
        array_agg(DISTINCT role) as roles
      FROM ticket_assignments
      WHERE ticket_id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows[0];
  }

  // جلب إحصائيات الإسناد لمستخدم
  static async getUserStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_assignments,
        COUNT(DISTINCT ticket_id) as unique_tickets,
        COUNT(DISTINCT role) as unique_roles
      FROM ticket_assignments
      WHERE user_id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = TicketAssignment;
