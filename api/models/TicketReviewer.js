const { pool } = require('../config/database');

class TicketReviewer {
  // إضافة مراجع إلى تذكرة
  static async create(reviewerData) {
    const {
      ticket_id,
      reviewer_id,
      added_by,
      review_notes
    } = reviewerData;

    const query = `
      INSERT INTO ticket_reviewers 
      (ticket_id, reviewer_id, added_by, review_notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      ticket_id,
      reviewer_id,
      added_by,
      review_notes
    ]);

    return result.rows[0];
  }

  // جلب جميع المراجعين لتذكرة معينة
  static async findByTicket(ticketId) {
    const query = `
      SELECT 
        tr.*,
        u.name as reviewer_name,
        u.email as reviewer_email,
        u.avatar_url as reviewer_avatar,
        ab.name as added_by_name
      FROM ticket_reviewers tr
      LEFT JOIN users u ON tr.reviewer_id = u.id
      LEFT JOIN users ab ON tr.added_by = ab.id
      WHERE tr.ticket_id = $1 AND tr.is_active = true
      ORDER BY tr.added_at DESC
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // جلب جميع التذاكر التي يراجعها مستخدم معين
  static async findByReviewer(reviewerId, options = {}) {
    const { 
      review_status = null, 
      is_active = true, 
      limit = 100, 
      offset = 0 
    } = options;

    let query = `
      SELECT 
        tr.*,
        t.title as ticket_title,
        t.ticket_number,
        t.status as ticket_status,
        t.priority,
        p.name as process_name
      FROM ticket_reviewers tr
      LEFT JOIN tickets t ON tr.ticket_id = t.id
      LEFT JOIN processes p ON t.process_id = p.id
      WHERE tr.reviewer_id = $1
    `;

    const params = [reviewerId];
    let paramIndex = 2;

    if (review_status) {
      query += ` AND tr.review_status = $${paramIndex}`;
      params.push(review_status);
      paramIndex++;
    }

    if (is_active !== null) {
      query += ` AND tr.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    query += ` ORDER BY tr.added_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // تحديث حالة المراجعة
  static async updateReviewStatus(id, statusData) {
    const { 
      review_status, 
      review_notes,
      reviewed_at = new Date() 
    } = statusData;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (review_status) {
      updates.push(`review_status = $${paramIndex}`);
      values.push(review_status);
      paramIndex++;
    }

    if (review_notes !== undefined) {
      updates.push(`review_notes = $${paramIndex}`);
      values.push(review_notes);
      paramIndex++;
    }

    if (review_status === 'completed') {
      updates.push(`reviewed_at = $${paramIndex}`);
      values.push(reviewed_at);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ticket_reviewers 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // تحديث معلومات المراجع
  static async update(id, updateData) {
    const { review_notes, is_active } = updateData;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (review_notes !== undefined) {
      updates.push(`review_notes = $${paramIndex}`);
      values.push(review_notes);
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
      UPDATE ticket_reviewers 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // حذف مراجع (soft delete)
  static async delete(id) {
    const query = `
      UPDATE ticket_reviewers 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // حذف مراجع (hard delete)
  static async hardDelete(id) {
    const query = `DELETE FROM ticket_reviewers WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // حذف جميع المراجعين لتذكرة معينة
  static async deleteByTicket(ticketId) {
    const query = `
      UPDATE ticket_reviewers 
      SET is_active = false, updated_at = NOW()
      WHERE ticket_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  // التحقق من وجود مراجع
  static async exists(ticketId, reviewerId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM ticket_reviewers 
        WHERE ticket_id = $1 AND reviewer_id = $2 AND is_active = true
      ) as exists
    `;

    const result = await pool.query(query, [ticketId, reviewerId]);
    return result.rows[0].exists;
  }

  // جلب إحصائيات المراجعة لتذكرة
  static async getTicketReviewStats(ticketId) {
    const query = `
      SELECT 
        COUNT(*) as total_reviewers,
        COUNT(*) FILTER (WHERE review_status = 'pending') as pending_reviews,
        COUNT(*) FILTER (WHERE review_status = 'in_progress') as in_progress_reviews,
        COUNT(*) FILTER (WHERE review_status = 'completed') as completed_reviews,
        COUNT(*) FILTER (WHERE review_status = 'skipped') as skipped_reviews
      FROM ticket_reviewers
      WHERE ticket_id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [ticketId]);
    return result.rows[0];
  }

  // جلب إحصائيات المراجعة لمستخدم
  static async getReviewerStats(reviewerId) {
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(DISTINCT ticket_id) as unique_tickets,
        COUNT(*) FILTER (WHERE review_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE review_status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE review_status = 'completed') as completed,
        COUNT(*) FILTER (WHERE review_status = 'skipped') as skipped
      FROM ticket_reviewers
      WHERE reviewer_id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [reviewerId]);
    return result.rows[0];
  }

  // بدء المراجعة
  static async startReview(id, reviewerId) {
    const query = `
      UPDATE ticket_reviewers 
      SET review_status = 'in_progress', updated_at = NOW()
      WHERE id = $1 AND reviewer_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, reviewerId]);
    return result.rows[0];
  }

  // إكمال المراجعة
  static async completeReview(id, reviewerId, reviewNotes = null) {
    const query = `
      UPDATE ticket_reviewers 
      SET 
        review_status = 'completed',
        reviewed_at = NOW(),
        review_notes = COALESCE($3, review_notes),
        updated_at = NOW()
      WHERE id = $1 AND reviewer_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, reviewerId, reviewNotes]);
    return result.rows[0];
  }

  // تخطي المراجعة
  static async skipReview(id, reviewerId, reviewNotes = null) {
    const query = `
      UPDATE ticket_reviewers 
      SET 
        review_status = 'skipped',
        review_notes = COALESCE($3, review_notes),
        updated_at = NOW()
      WHERE id = $1 AND reviewer_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, reviewerId, reviewNotes]);
    return result.rows[0];
  }
}

module.exports = TicketReviewer;
