const { pool } = require('../config/database');

class UserTicketLink {
  constructor(row) {
    Object.assign(this, row);
  }

  static async ensureTable() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_ticket_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'جاري المعالجة' CHECK (status IN ('جاري المعالجة', 'تمت المعالجة', 'منتهية')),
          from_process_name VARCHAR(255),
          to_process_name VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, ticket_id)
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_ticket_links_user ON user_ticket_links(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_ticket_links_ticket ON user_ticket_links(ticket_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_ticket_links_status ON user_ticket_links(status);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_ticket_links_user_ticket ON user_ticket_links(user_id, ticket_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_ticket_links_created_at ON user_ticket_links(created_at);`);
    } finally {
      client.release();
    }
  }

  // إنشاء سجل جديد
  static async create({ user_id, ticket_id, status = 'جاري المعالجة', from_process_name = null, to_process_name = null }) {
    const query = `
      INSERT INTO user_ticket_links (user_id, ticket_id, status, from_process_name, to_process_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, ticket_id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        from_process_name = EXCLUDED.from_process_name,
        to_process_name = EXCLUDED.to_process_name,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [user_id, ticket_id, status, from_process_name, to_process_name];
    const { rows } = await pool.query(query, values);
    return new UserTicketLink(rows[0]);
  }

  // جلب سجل بالمعرف
  static async findById(id) {
    const { rows } = await pool.query(`
      SELECT 
        utl.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        t.ticket_number,
        t.title as ticket_title,
        t.status as ticket_status
      FROM user_ticket_links utl
      LEFT JOIN users u ON utl.user_id = u.id
      LEFT JOIN tickets t ON utl.ticket_id = t.id
      WHERE utl.id = $1
    `, [id]);
    return rows[0] ? new UserTicketLink(rows[0]) : null;
  }

  // جلب جميع السجلات مع فلاتر
  static async findAll({ user_id, ticket_id, status } = {}) {
    const where = [];
    const params = [];
    let i = 1;

    if (user_id) {
      where.push(`utl.user_id = $${i++}`);
      params.push(user_id);
    }
    if (ticket_id) {
      where.push(`utl.ticket_id = $${i++}`);
      params.push(ticket_id);
    }
    if (status) {
      where.push(`utl.status = $${i++}`);
      params.push(status);
    }

    const sql = `
      SELECT 
        utl.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        t.ticket_number,
        t.title as ticket_title,
        t.status as ticket_status,
        t.process_id,
        p.name as process_name
      FROM user_ticket_links utl
      LEFT JOIN users u ON utl.user_id = u.id
      LEFT JOIN tickets t ON utl.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY utl.created_at DESC
    `;

    const { rows } = await pool.query(sql, params);
    return rows.map(r => new UserTicketLink(r));
  }

  // جلب سجلات مستخدم معين
  static async findByUserId(user_id, { status } = {}) {
    return this.findAll({ user_id, status });
  }

  // جلب سجلات تذكرة معينة
  static async findByTicketId(ticket_id, { status } = {}) {
    return this.findAll({ ticket_id, status });
  }

  // تحديث السجل
  async update({ status, from_process_name, to_process_name }) {
    const updates = [];
    const values = [];
    let i = 1;

    if (status !== undefined) {
      // التحقق من صحة الحالة
      const validStatuses = ['جاري المعالجة', 'تمت المعالجة', 'منتهية'];
      if (!validStatuses.includes(status)) {
        throw new Error(`الحالة يجب أن تكون واحدة من: ${validStatuses.join(', ')}`);
      }
      updates.push(`status = $${i++}`);
      values.push(status);
    }

    if (from_process_name !== undefined) {
      updates.push(`from_process_name = $${i++}`);
      values.push(from_process_name);
    }

    if (to_process_name !== undefined) {
      updates.push(`to_process_name = $${i++}`);
      values.push(to_process_name);
    }

    if (updates.length === 0) {
      return this;
    }

    updates.push(`updated_at = NOW()`);
    values.push(this.id);

    const query = `
      UPDATE user_ticket_links
      SET ${updates.join(', ')}
      WHERE id = $${i}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    Object.assign(this, rows[0]);
    return this;
  }

  // حذف سجل
  async delete() {
    await pool.query('DELETE FROM user_ticket_links WHERE id = $1', [this.id]);
    return true;
  }

  // التحقق من وجود سجل
  static async exists(user_id, ticket_id) {
    const { rows } = await pool.query(
      'SELECT id FROM user_ticket_links WHERE user_id = $1 AND ticket_id = $2',
      [user_id, ticket_id]
    );
    return rows.length > 0;
  }
}

module.exports = UserTicketLink;

