const { pool } = require('../config/database');

class TicketEvaluationSummary {
  // إنشاء أو تحديث ملخص التقييم
  static async upsert(summaryData) {
    const {
      ticket_id,
      total_reviewers,
      completed_reviews,
      average_score,
      overall_rating,
      evaluation_data,
      completed_at
    } = summaryData;

    const query = `
      INSERT INTO ticket_evaluation_summary 
      (ticket_id, total_reviewers, completed_reviews, average_score, overall_rating, evaluation_data, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (ticket_id) DO UPDATE SET
        total_reviewers = EXCLUDED.total_reviewers,
        completed_reviews = EXCLUDED.completed_reviews,
        average_score = EXCLUDED.average_score,
        overall_rating = EXCLUDED.overall_rating,
        evaluation_data = EXCLUDED.evaluation_data,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW()
      RETURNING *
    `;

    const evaluationDataJson = typeof evaluation_data === 'string' 
      ? evaluation_data 
      : JSON.stringify(evaluation_data);

    const result = await pool.query(query, [
      ticket_id,
      total_reviewers,
      completed_reviews,
      average_score,
      overall_rating,
      evaluationDataJson,
      completed_at
    ]);

    return result.rows[0];
  }

  // جلب ملخص التقييم لتذكرة معينة
  static async findByTicket(ticketId) {
    const query = `SELECT * FROM ticket_evaluation_summary WHERE ticket_id = $1`;
    const result = await pool.query(query, [ticketId]);
    return result.rows[0];
  }

  // حساب وتحديث ملخص التقييم تلقائياً
  static async calculateAndUpdate(ticketId) {
    const client = await pool.connect();
    try {
      // جلب إحصائيات المراجعين
      const reviewersQuery = `
        SELECT 
          COUNT(*) as total_reviewers,
          COUNT(*) FILTER (WHERE review_status = 'completed') as completed_reviews
        FROM ticket_reviewers
        WHERE ticket_id = $1 AND is_active = true
      `;
      const reviewersResult = await client.query(reviewersQuery, [ticketId]);
      const { total_reviewers, completed_reviews } = reviewersResult.rows[0];

      // جلب متوسط الدرجات
      const scoresQuery = `
        SELECT 
          AVG(score) as average_score,
          COUNT(*) as total_evaluations,
          COUNT(DISTINCT criteria_id) as evaluated_criteria
        FROM ticket_evaluations
        WHERE ticket_id = $1 AND score IS NOT NULL
      `;
      const scoresResult = await client.query(scoresQuery, [ticketId]);
      const { average_score } = scoresResult.rows[0];

      // جلب ملخص تفصيلي للتقييمات
      const detailsQuery = `
        SELECT 
          ec.name,
          ec.name_ar,
          ec.category,
          array_agg(te.rating) as ratings,
          AVG(te.score) as avg_score,
          COUNT(*) as rating_count
        FROM ticket_evaluations te
        LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
        WHERE te.ticket_id = $1
        GROUP BY ec.id, ec.name, ec.name_ar, ec.category
      `;
      const detailsResult = await client.query(detailsQuery, [ticketId]);
      
      const evaluation_data = {
        criteria_summary: detailsResult.rows,
        last_updated: new Date().toISOString()
      };

      // تحديد التقييم الإجمالي
      let overall_rating = null;
      if (average_score !== null) {
        if (average_score >= 4.5) overall_rating = 'ممتاز';
        else if (average_score >= 3.5) overall_rating = 'جيد جداً';
        else if (average_score >= 2.5) overall_rating = 'جيد';
        else if (average_score >= 1.5) overall_rating = 'مقبول';
        else overall_rating = 'ضعيف';
      }

      const completed_at = completed_reviews === total_reviewers && total_reviewers > 0 
        ? new Date() 
        : null;

      // حفظ الملخص
      return await this.upsert({
        ticket_id: ticketId,
        total_reviewers: parseInt(total_reviewers),
        completed_reviews: parseInt(completed_reviews),
        average_score: average_score ? parseFloat(average_score) : null,
        overall_rating,
        evaluation_data,
        completed_at
      });

    } finally {
      client.release();
    }
  }

  // جلب جميع الملخصات مع فلاتر
  static async findAll(filters = {}) {
    const { 
      overall_rating, 
      min_average_score,
      max_average_score,
      completed_only = false,
      limit = 100, 
      offset = 0 
    } = filters;

    let query = `
      SELECT 
        tes.*,
        t.title as ticket_title,
        t.ticket_number,
        t.status as ticket_status,
        p.name as process_name
      FROM ticket_evaluation_summary tes
      LEFT JOIN tickets t ON tes.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (overall_rating) {
      query += ` AND tes.overall_rating = $${paramIndex}`;
      params.push(overall_rating);
      paramIndex++;
    }

    if (min_average_score !== undefined) {
      query += ` AND tes.average_score >= $${paramIndex}`;
      params.push(min_average_score);
      paramIndex++;
    }

    if (max_average_score !== undefined) {
      query += ` AND tes.average_score <= $${paramIndex}`;
      params.push(max_average_score);
      paramIndex++;
    }

    if (completed_only) {
      query += ` AND tes.completed_at IS NOT NULL`;
    }

    query += ` ORDER BY tes.average_score DESC NULLS LAST, tes.updated_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // حذف ملخص
  static async delete(ticketId) {
    const query = `DELETE FROM ticket_evaluation_summary WHERE ticket_id = $1 RETURNING *`;
    const result = await pool.query(query, [ticketId]);
    return result.rows[0];
  }

  // جلب إحصائيات عامة للتقييمات
  static async getGlobalStats() {
    const query = `
      SELECT 
        COUNT(*) as total_summaries,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_summaries,
        AVG(average_score) as overall_average_score,
        COUNT(*) FILTER (WHERE overall_rating = 'ممتاز') as excellent_count,
        COUNT(*) FILTER (WHERE overall_rating = 'جيد جداً') as very_good_count,
        COUNT(*) FILTER (WHERE overall_rating = 'جيد') as good_count,
        COUNT(*) FILTER (WHERE overall_rating = 'مقبول') as fair_count,
        COUNT(*) FILTER (WHERE overall_rating = 'ضعيف') as poor_count
      FROM ticket_evaluation_summary
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  // جلب أفضل التذاكر تقييماً
  static async getTopRatedTickets(limit = 10) {
    const query = `
      SELECT 
        tes.*,
        t.title as ticket_title,
        t.ticket_number,
        p.name as process_name
      FROM ticket_evaluation_summary tes
      LEFT JOIN tickets t ON tes.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE tes.average_score IS NOT NULL
      AND tes.completed_at IS NOT NULL
      ORDER BY tes.average_score DESC, tes.completed_reviews DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // جلب التذاكر التي تحتاج تحسين
  static async getLowRatedTickets(limit = 10) {
    const query = `
      SELECT 
        tes.*,
        t.title as ticket_title,
        t.ticket_number,
        p.name as process_name
      FROM ticket_evaluation_summary tes
      LEFT JOIN tickets t ON tes.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE tes.average_score IS NOT NULL
      AND tes.completed_at IS NOT NULL
      ORDER BY tes.average_score ASC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // جلب التذاكر غير المكتملة (تنتظر مراجعات)
  static async getPendingEvaluations() {
    const query = `
      SELECT 
        tes.*,
        t.title as ticket_title,
        t.ticket_number,
        p.name as process_name,
        (tes.total_reviewers - tes.completed_reviews) as pending_reviews
      FROM ticket_evaluation_summary tes
      LEFT JOIN tickets t ON tes.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE tes.completed_reviews < tes.total_reviewers
      ORDER BY pending_reviews DESC, tes.updated_at ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = TicketEvaluationSummary;
