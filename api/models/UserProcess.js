const { pool } = require('../config/database');

class UserProcess {
  constructor(row) {
    Object.assign(this, row);
  }

  static async ensureTable() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_processes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'member',
          is_active BOOLEAN DEFAULT TRUE,
          added_by UUID REFERENCES users(id),
          added_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, process_id)
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_processes_user ON user_processes(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_processes_process ON user_processes(process_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_processes_active ON user_processes(is_active);`);
    } finally {
      client.release();
    }
  }

  static async create({ user_id, process_id, role = 'member', added_by, client = null }) {
    const query = `
      INSERT INTO user_processes (user_id, process_id, role, added_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, process_id) DO UPDATE SET role = EXCLUDED.role, is_active = TRUE, updated_at = NOW()
      RETURNING *
    `;
    const values = [user_id, process_id, role, added_by || null];
    // استخدام client إذا تم تمريره (من داخل transaction)، وإلا استخدام pool
    const { rows } = await (client || pool).query(query, values);
    return new UserProcess(rows[0]);
  }

  static async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM user_processes WHERE id = $1`, [id]);
    return rows[0] ? new UserProcess(rows[0]) : null;
    
  }

  static async findAll({ user_id, process_id, is_active, client = null } = {}) {
    const where = [];
    const params = [];
    let i = 1;
    if (user_id) { where.push(`user_id = $${i++}`); params.push(user_id); }
    if (process_id) { where.push(`process_id = $${i++}`); params.push(process_id); }
    if (is_active !== undefined) { where.push(`is_active = $${i++}`); params.push(is_active); }
    const sql = `SELECT * FROM user_processes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY added_at DESC`;
    // استخدام client إذا تم تمريره (من داخل transaction)، وإلا استخدام pool
    const { rows } = await (client || pool).query(sql, params);
    return rows.map(r => new UserProcess(r));
  }

  static async getProcessesForUser(user_id) {
    const sql = `
      SELECT p.*, up.role, up.is_active, up.id as user_process_id, up.added_at, up.updated_at
      FROM user_processes up
      JOIN processes p ON up.process_id = p.id
      WHERE up.user_id = $1 AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(sql, [user_id]);
    return rows;
  }

  static async getUsersForProcess(process_id) {
    const sql = `
      SELECT u.id, u.name, u.email, u.avatar_url, u.role_id, up.role as process_role, up.is_active, up.id as user_process_id, up.added_at
      FROM user_processes up
      JOIN users u ON up.user_id = u.id
      WHERE up.process_id = $1 AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `;
    const { rows } = await pool.query(sql, [process_id]);
    return rows;
  }

  async update({ role, is_active }) {
    const fields = [];
    const params = [];
    let i = 1;
    if (role !== undefined) { fields.push(`role = $${i++}`); params.push(role); }
    if (is_active !== undefined) { fields.push(`is_active = $${i++}`); params.push(is_active); }
    if (!fields.length) return this;
    fields.push(`updated_at = NOW()`);
    params.push(this.id);
    const sql = `UPDATE user_processes SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    const { rows } = await pool.query(sql, params);
    Object.assign(this, rows[0]);
    return this;
  }

  async delete() {
    const { rowCount } = await pool.query(`DELETE FROM user_processes WHERE id = $1`, [this.id]);
    return rowCount > 0;
  }
}

module.exports = UserProcess;
