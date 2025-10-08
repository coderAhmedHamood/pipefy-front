const { pool } = require('../config/database');

class TicketEvaluation {
  // إضافة تقييم جديد
  static async create(evaluationData) {
    const {
      ticket_id,
      reviewer_id,
      criteria_id,
      rating,
      score,
      notes
    } = evaluationData;

    const query = `
      INSERT INTO ticket_evaluations 
      (ticket_id, reviewer_id, criteria_id, rating, score, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      ticket_id,
      reviewer_id,
      criteria_id,
      rating,
      score,
      notes
    ]);

    return result.rows[0];
  }

  // إضافة تقييمات متعددة دفعة واحدة
  static async createBatch(evaluations) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const evaluation of evaluations) {
        const query = `
          INSERT INTO ticket_evaluations 
          (ticket_id, reviewer_id, criteria_id, rating, score, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (ticket_id, reviewer_id, criteria_id) 
          DO UPDATE SET
            rating = EXCLUDED.rating,
            score = EXCLUDED.score,
            notes = EXCLUDED.notes,
            evaluated_at = NOW(),
            updated_at = NOW()
          RETURNING *
        `;

        const result = await client.query(query, [
          evaluation.ticket_id,
          evaluation.reviewer_id,
          evaluation.criteria_id,
          evaluation.rating,
          evaluation.score,
          evaluation.notes
        ]);

        results.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // جلب جميع التقييمات لتذكرة معينة
  static async findByTicket(ticketId) {
    const query = `
      SELECT 
        te.*,
        ec.name as criteria_name,
        ec.name_ar as criteria_name_ar,
        ec.category as criteria_category,
        ec.options as criteria_options,
        u.name as reviewer_name,
        u.email as reviewer_email
      FROM ticket_evaluations te
      LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
      LEFT JOIN users u ON te.reviewer_id = u.id
      WHERE te.ticket_id = $1
      ORDER BY ec.display_order, te.evaluated_at DESC
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // جلب تقييمات مراجع معين لتذكرة معينة
  static async findByTicketAndReviewer(ticketId, reviewerId) {
    const query = `
      SELECT 
        te.*,
        ec.name as criteria_name,
        ec.name_ar as criteria_name_ar,
        ec.category as criteria_category,
        ec.options as criteria_options
      FROM ticket_evaluations te
      LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
      WHERE te.ticket_id = $1 AND te.reviewer_id = $2
      ORDER BY ec.display_order
    `;

    const result = await pool.query(query, [ticketId, reviewerId]);
    return result.rows;
  }

  // جلب جميع تقييمات مراجع معين
  static async findByReviewer(reviewerId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const query = `
      SELECT 
        te.*,
        ec.name as criteria_name,
        ec.name_ar as criteria_name_ar,
        ec.category as criteria_category,
        t.title as ticket_title,
        t.ticket_number
      FROM ticket_evaluations te
      LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
      LEFT JOIN tickets t ON te.ticket_id = t.id
      WHERE te.reviewer_id = $1
      ORDER BY te.evaluated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [reviewerId, limit, offset]);
    return result.rows;
  }

  // تحديث تقييم
  static async update(id, updateData) {
    const { rating, score, notes } = updateData;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (rating !== undefined) {
      updates.push(`rating = $${paramIndex}`);
      values.push(rating);
      paramIndex++;
    }

    if (score !== undefined) {
      updates.push(`score = $${paramIndex}`);
      values.push(score);
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`evaluated_at = NOW()`);
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ticket_evaluations 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // حذف تقييم
  static async delete(id) {
    const query = `DELETE FROM ticket_evaluations WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // حذف جميع التقييمات لتذكرة معينة
  static async deleteByTicket(ticketId) {
    const query = `DELETE FROM ticket_evaluations WHERE ticket_id = $1 RETURNING *`;
    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // حذف جميع تقييمات مراجع معين لتذكرة معينة
  static async deleteByTicketAndReviewer(ticketId, reviewerId) {
    const query = `
      DELETE FROM ticket_evaluations 
      WHERE ticket_id = $1 AND reviewer_id = $2 
      RETURNING *
    `;

    const result = await pool.query(query, [ticketId, reviewerId]);
    return result.rows;
  }

  // جلب متوسط التقييمات لتذكرة
  static async getTicketAverageScore(ticketId) {
    const query = `
      SELECT 
        AVG(score) as average_score,
        COUNT(*) as total_evaluations,
        COUNT(DISTINCT reviewer_id) as total_reviewers,
        COUNT(DISTINCT criteria_id) as total_criteria
      FROM ticket_evaluations
      WHERE ticket_id = $1 AND score IS NOT NULL
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows[0];
  }

  // جلب ملخص التقييمات لتذكرة حسب المعيار
  static async getTicketEvaluationSummary(ticketId) {
    const query = `
      SELECT 
        ec.name as criteria_name,
        ec.name_ar as criteria_name_ar,
        ec.category,
        COUNT(*) as rating_count,
        AVG(te.score) as average_score,
        array_agg(te.rating) as ratings,
        array_agg(u.name) as reviewer_names
      FROM ticket_evaluations te
      LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
      LEFT JOIN users u ON te.reviewer_id = u.id
      WHERE te.ticket_id = $1
      GROUP BY ec.id, ec.name, ec.name_ar, ec.category, ec.display_order
      ORDER BY ec.display_order
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // جلب إحصائيات تقييمات المراجع
  static async getReviewerStats(reviewerId) {
    const query = `
      SELECT 
        COUNT(*) as total_evaluations,
        COUNT(DISTINCT ticket_id) as total_tickets,
        COUNT(DISTINCT criteria_id) as total_criteria,
        AVG(score) as average_score_given
      FROM ticket_evaluations
      WHERE reviewer_id = $1
    `;

    const result = await pool.query(query, [reviewerId]);
    return result.rows[0];
  }

  // التحقق من اكتمال التقييم
  static async isEvaluationComplete(ticketId, reviewerId) {
    const query = `
      SELECT 
        ec.id as criteria_id,
        ec.name_ar,
        ec.is_required,
        te.id as evaluation_id
      FROM evaluation_criteria ec
      LEFT JOIN ticket_evaluations te ON 
        te.criteria_id = ec.id AND 
        te.ticket_id = $1 AND 
        te.reviewer_id = $2
      WHERE ec.is_active = true
    `;

    const result = await pool.query(query, [ticketId, reviewerId]);
    
    const requiredCriteria = result.rows.filter(row => row.is_required);
    const completedRequired = requiredCriteria.filter(row => row.evaluation_id !== null);
    
    return {
      is_complete: requiredCriteria.length === completedRequired.length,
      total_criteria: result.rows.length,
      required_criteria: requiredCriteria.length,
      completed_required: completedRequired.length,
      missing_required: requiredCriteria.filter(row => row.evaluation_id === null)
    };
  }

  // جلب التقييمات المفقودة
  static async getMissingEvaluations(ticketId, reviewerId, category = null) {
    let query = `
      SELECT 
        ec.id,
        ec.name,
        ec.name_ar,
        ec.category,
        ec.options,
        ec.is_required
      FROM evaluation_criteria ec
      WHERE ec.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM ticket_evaluations te
        WHERE te.criteria_id = ec.id
        AND te.ticket_id = $1
        AND te.reviewer_id = $2
      )
    `;

    const params = [ticketId, reviewerId];

    if (category) {
      query += ` AND ec.category = $3`;
      params.push(category);
    }

    query += ` ORDER BY ec.display_order`;

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = TicketEvaluation;
