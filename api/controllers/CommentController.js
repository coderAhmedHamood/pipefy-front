const { pool } = require('../config/database');

class CommentController {
  // جلب تعليقات تذكرة
  static async getTicketComments(req, res) {
    try {
      const { ticket_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const result = await pool.query(`
        SELECT 
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.ticket_id = $1
        ORDER BY tc.created_at DESC
        LIMIT $2 OFFSET $3
      `, [ticket_id, limit, offset]);
      
      const countResult = await pool.query(`
        SELECT COUNT(*) as total FROM ticket_comments WHERE ticket_id = $1
      `, [ticket_id]);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      console.error('خطأ في جلب التعليقات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التعليقات',
        error: error.message
      });
    }
  }
  
  // إضافة تعليق جديد
  static async create(req, res) {
    try {
      const { ticket_id } = req.params;
      const { content, is_internal = false } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'محتوى التعليق مطلوب'
        });
      }
      
      // التحقق من وجود التذكرة
      const ticketCheck = await pool.query(`
        SELECT id FROM tickets WHERE id = $1
      `, [ticket_id]);
      
      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }
      
      const result = await pool.query(`
        INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [ticket_id, req.user.id, content.trim(), is_internal]);
      
      // جلب التعليق مع بيانات المؤلف
      const commentResult = await pool.query(`
        SELECT 
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.id = $1
      `, [result.rows[0].id]);
      
      // إضافة نشاط للتذكرة
      await pool.query(`
        INSERT INTO ticket_activities (
          ticket_id, user_id, activity_type, description, data
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        ticket_id, req.user.id, 'comment_added',
        `أضاف تعليق${is_internal ? ' داخلي' : ''}`,
        JSON.stringify({ comment_id: result.rows[0].id, is_internal })
      ]);
      
      res.status(201).json({
        success: true,
        message: 'تم إضافة التعليق بنجاح',
        data: commentResult.rows[0]
      });
    } catch (error) {
      console.error('خطأ في إضافة التعليق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة التعليق',
        error: error.message
      });
    }
  }
  
  // تحديث تعليق
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { content, is_internal } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'محتوى التعليق مطلوب'
        });
      }
      
      // التحقق من ملكية التعليق
      const commentCheck = await pool.query(`
        SELECT user_id FROM ticket_comments WHERE id = $1
      `, [id]);
      
      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التعليق غير موجود'
        });
      }
      
      if (commentCheck.rows[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بتعديل هذا التعليق'
        });
      }
      
      const result = await pool.query(`
        UPDATE ticket_comments 
        SET 
          content = $1,
          is_internal = COALESCE($2, is_internal),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [content.trim(), is_internal, id]);
      
      // جلب التعليق مع بيانات المؤلف
      const commentResult = await pool.query(`
        SELECT 
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.id = $1
      `, [id]);
      
      res.json({
        success: true,
        message: 'تم تحديث التعليق بنجاح',
        data: commentResult.rows[0]
      });
    } catch (error) {
      console.error('خطأ في تحديث التعليق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث التعليق',
        error: error.message
      });
    }
  }
  
  // حذف تعليق
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // التحقق من ملكية التعليق
      const commentCheck = await pool.query(`
        SELECT user_id, ticket_id FROM ticket_comments WHERE id = $1
      `, [id]);
      
      if (commentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التعليق غير موجود'
        });
      }
      
      if (commentCheck.rows[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بحذف هذا التعليق'
        });
      }
      
      await pool.query(`
        DELETE FROM ticket_comments WHERE id = $1
      `, [id]);
      
      // إضافة نشاط للتذكرة
      await pool.query(`
        INSERT INTO ticket_activities (
          ticket_id, user_id, activity_type, description, data
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        commentCheck.rows[0].ticket_id, req.user.id, 'comment_deleted',
        'حذف تعليق',
        JSON.stringify({ comment_id: id })
      ]);
      
      res.json({
        success: true,
        message: 'تم حذف التعليق بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف التعليق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف التعليق',
        error: error.message
      });
    }
  }
  
  // جلب تعليق واحد
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT 
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar,
          t.title as ticket_title,
          t.ticket_number
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        JOIN tickets t ON tc.ticket_id = t.id
        WHERE tc.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التعليق غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في جلب التعليق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التعليق',
        error: error.message
      });
    }
  }
  
  // البحث في التعليقات
  static async search(req, res) {
    try {
      const { 
        q, 
        ticket_id, 
        user_id, 
        is_internal,
        page = 1, 
        limit = 20 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar,
          t.title as ticket_title,
          t.ticket_number
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        JOIN tickets t ON tc.ticket_id = t.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (q) {
        paramCount++;
        query += ` AND tc.content ILIKE $${paramCount}`;
        params.push(`%${q}%`);
      }
      
      if (ticket_id) {
        paramCount++;
        query += ` AND tc.ticket_id = $${paramCount}`;
        params.push(ticket_id);
      }
      
      if (user_id) {
        paramCount++;
        query += ` AND tc.user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      if (is_internal !== undefined) {
        paramCount++;
        query += ` AND tc.is_internal = $${paramCount}`;
        params.push(is_internal === 'true');
      }
      
      query += ` 
        ORDER BY tc.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // عدد إجمالي النتائج
      let countQuery = `
        SELECT COUNT(*) as total
        FROM ticket_comments tc
        WHERE 1=1
      `;
      const countParams = [];
      let countParamCount = 0;
      
      if (q) {
        countParamCount++;
        countQuery += ` AND tc.content ILIKE $${countParamCount}`;
        countParams.push(`%${q}%`);
      }
      
      if (ticket_id) {
        countParamCount++;
        countQuery += ` AND tc.ticket_id = $${countParamCount}`;
        countParams.push(ticket_id);
      }
      
      if (user_id) {
        countParamCount++;
        countQuery += ` AND tc.user_id = $${countParamCount}`;
        countParams.push(user_id);
      }
      
      if (is_internal !== undefined) {
        countParamCount++;
        countQuery += ` AND tc.is_internal = $${countParamCount}`;
        countParams.push(is_internal === 'true');
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('خطأ في البحث في التعليقات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث في التعليقات',
        error: error.message
      });
    }
  }
}

module.exports = CommentController;
