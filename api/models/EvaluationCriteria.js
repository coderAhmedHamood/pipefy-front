const { pool } = require('../config/database');

class EvaluationCriteria {
  // إنشاء معيار تقييم جديد
  static async create(criteriaData) {
    const {
      name,
      name_ar,
      description,
      category,
      options, // Array أو JSON string
      is_required = false,
      display_order = 0
    } = criteriaData;

    const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);

    const query = `
      INSERT INTO evaluation_criteria 
      (name, name_ar, description, category, options, is_required, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      name_ar,
      description,
      category,
      optionsJson,
      is_required,
      display_order
    ]);

    return result.rows[0];
  }

  // جلب جميع معايير التقييم
  static async findAll(filters = {}) {
    const { category, is_active = true } = filters;

    let query = `
      SELECT * FROM evaluation_criteria
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_active !== null) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    query += ` ORDER BY category, display_order, name_ar`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // جلب معيار تقييم بالـ ID
  static async findById(id) {
    const query = `SELECT * FROM evaluation_criteria WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // جلب معايير التقييم حسب الفئة
  static async findByCategory(category) {
    const query = `
      SELECT * FROM evaluation_criteria
      WHERE category = $1 AND is_active = true
      ORDER BY display_order, name_ar
    `;

    const result = await pool.query(query, [category]);
    return result.rows;
  }

  // جلب جميع الفئات المتاحة
  static async getAllCategories() {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM evaluation_criteria
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // تحديث معيار تقييم
  static async update(id, updateData) {
    const {
      name,
      name_ar,
      description,
      category,
      options,
      is_required,
      display_order,
      is_active
    } = updateData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (name_ar !== undefined) {
      updates.push(`name_ar = $${paramIndex}`);
      values.push(name_ar);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (options !== undefined) {
      const optionsJson = typeof options === 'string' ? options : JSON.stringify(options);
      updates.push(`options = $${paramIndex}`);
      values.push(optionsJson);
      paramIndex++;
    }

    if (is_required !== undefined) {
      updates.push(`is_required = $${paramIndex}`);
      values.push(is_required);
      paramIndex++;
    }

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      values.push(display_order);
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
      UPDATE evaluation_criteria 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // حذف معيار تقييم (soft delete)
  static async delete(id) {
    const query = `
      UPDATE evaluation_criteria 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // حذف معيار تقييم (hard delete)
  static async hardDelete(id) {
    const query = `DELETE FROM evaluation_criteria WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // التحقق من وجود معيار تقييم
  static async exists(name, category) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM evaluation_criteria 
        WHERE name = $1 AND category = $2
      ) as exists
    `;

    const result = await pool.query(query, [name, category]);
    return result.rows[0].exists;
  }

  // جلب معايير التقييم الإلزامية
  static async getRequiredCriteria(category = null) {
    let query = `
      SELECT * FROM evaluation_criteria
      WHERE is_required = true AND is_active = true
    `;

    const params = [];
    
    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY display_order, name_ar`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // إعادة ترتيب معايير التقييم
  static async reorder(criteriaOrders) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const { id, display_order } of criteriaOrders) {
        await client.query(
          'UPDATE evaluation_criteria SET display_order = $1, updated_at = NOW() WHERE id = $2',
          [display_order, id]
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

  // جلب إحصائيات معايير التقييم
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_criteria,
        COUNT(DISTINCT category) as total_categories,
        COUNT(*) FILTER (WHERE is_required = true) as required_criteria,
        COUNT(*) FILTER (WHERE is_active = true) as active_criteria
      FROM evaluation_criteria
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = EvaluationCriteria;
