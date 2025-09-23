const { pool } = require('../config/database');

class CommentController {
  // جلب تعليقات تذكرة
  static async getTicketComments(req, res) {
    try {
      const { ticket_id, id } = req.params;
      const ticketId = ticket_id || id; // دعم كلا التنسيقين
      const {
        page = 1,
        limit = 20,
        include_internal = 'true',
        sort_order = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // التحقق من وجود التذكرة أولاً
      const ticketCheck = await pool.query(`
        SELECT id, title, ticket_number FROM tickets WHERE id = $1
      `, [ticketId]);

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // بناء شرط التصفية للتعليقات الداخلية
      let internalFilter = '';
      if (include_internal === 'false') {
        internalFilter = 'AND tc.is_internal = false';
      }

      const result = await pool.query(`
        SELECT
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar,
          parent_tc.content as parent_content,
          parent_u.name as parent_author_name,
          (
            SELECT COUNT(*)
            FROM ticket_comments child
            WHERE child.parent_comment_id = tc.id
          ) as replies_count
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        LEFT JOIN ticket_comments parent_tc ON tc.parent_comment_id = parent_tc.id
        LEFT JOIN users parent_u ON parent_tc.user_id = parent_u.id
        WHERE tc.ticket_id = $1 ${internalFilter}
        ORDER BY tc.created_at ${sortDirection}
        LIMIT $2 OFFSET $3
      `, [ticketId, limit, offset]);

      const countResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM ticket_comments tc
        WHERE tc.ticket_id = $1 ${internalFilter}
      `, [ticketId]);

      // معالجة المرفقات
      const processedComments = result.rows.map(comment => ({
        ...comment,
        attachments: comment.attachments || [],
        has_replies: comment.replies_count > 0,
        parent_comment: comment.parent_comment_id ? {
          id: comment.parent_comment_id,
          content: comment.parent_content ? comment.parent_content.substring(0, 100) + '...' : null,
          author_name: comment.parent_author_name
        } : null
      }));

      res.json({
        success: true,
        data: processedComments,
        ticket_info: {
          id: ticketCheck.rows[0].id,
          title: ticketCheck.rows[0].title,
          ticket_number: ticketCheck.rows[0].ticket_number
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        },
        filters: {
          include_internal: include_internal === 'true',
          sort_order: sortDirection.toLowerCase()
        }
      });
    } catch (error) {
      console.error('خطأ في جلب التعليقات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التعليقات',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }
  
  // إضافة تعليق جديد
  static async create(req, res) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { ticket_id, id } = req.params;
      const ticketId = ticket_id || id; // دعم كلا التنسيقين
      const { content, is_internal = false, parent_comment_id = null } = req.body;

      // التحقق من صحة البيانات
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'محتوى التعليق مطلوب'
        });
      }

      if (content.trim().length > 10000) {
        return res.status(400).json({
          success: false,
          message: 'محتوى التعليق طويل جداً (الحد الأقصى 10000 حرف)'
        });
      }

      // التحقق من وجود التذكرة
      const ticketCheck = await client.query(`
        SELECT id, title, ticket_number FROM tickets WHERE id = $1
      `, [ticketId]);

      if (ticketCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // التحقق من التعليق الأب إذا كان موجوداً
      if (parent_comment_id) {
        const parentCheck = await client.query(`
          SELECT id FROM ticket_comments
          WHERE id = $1 AND ticket_id = $2
        `, [parent_comment_id, ticketId]);

        if (parentCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'التعليق الأب غير موجود أو لا ينتمي لنفس التذكرة'
          });
        }
      }

      // إدراج التعليق الجديد
      const result = await client.query(`
        INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, parent_comment_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [ticketId, req.user.id, content.trim(), is_internal, parent_comment_id]);

      // جلب التعليق مع بيانات المؤلف
      const commentResult = await client.query(`
        SELECT
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar,
          t.ticket_number,
          t.title as ticket_title
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        JOIN tickets t ON tc.ticket_id = t.id
        WHERE tc.id = $1
      `, [result.rows[0].id]);

      // إضافة نشاط للتذكرة
      await client.query(`
        INSERT INTO ticket_activities (
          ticket_id, user_id, activity_type, description, metadata
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        ticketId, req.user.id, 'commented',
        `أضاف تعليق${is_internal ? ' داخلي' : ''}${parent_comment_id ? ' (رد)' : ''}`,
        JSON.stringify({
          comment_id: result.rows[0].id,
          is_internal,
          parent_comment_id,
          content_preview: content.trim().substring(0, 100)
        })
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'تم إضافة التعليق بنجاح',
        data: commentResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('خطأ في إضافة التعليق:', error);

      // معالجة أخطاء قاعدة البيانات المحددة
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'خطأ في البيانات المرجعية - تأكد من صحة معرفات التذكرة والمستخدم'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة التعليق',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    } finally {
      client.release();
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { id } = req.params;

      // التحقق من وجود التعليق والحصول على معلوماته
      const commentCheck = await client.query(`
        SELECT
          tc.*,
          t.ticket_number,
          u.name as author_name
        FROM ticket_comments tc
        JOIN tickets t ON tc.ticket_id = t.id
        JOIN users u ON tc.user_id = u.id
        WHERE tc.id = $1
      `, [id]);

      if (commentCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'التعليق غير موجود'
        });
      }

      const comment = commentCheck.rows[0];

      // التحقق من الصلاحيات: المؤلف أو المدير يمكنه الحذف
      const isOwner = comment.user_id === req.user.id;
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

      if (!isOwner && !isAdmin) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بحذف هذا التعليق'
        });
      }

      // التحقق من وجود تعليقات فرعية
      const childCommentsCheck = await client.query(`
        SELECT COUNT(*) as count FROM ticket_comments WHERE parent_comment_id = $1
      `, [id]);

      if (childCommentsCheck.rows[0].count > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف التعليق لأنه يحتوي على ردود. احذف الردود أولاً.'
        });
      }

      // حذف التعليق
      await client.query(`
        DELETE FROM ticket_comments WHERE id = $1
      `, [id]);

      // إضافة نشاط للتذكرة
      await client.query(`
        INSERT INTO ticket_activities (
          ticket_id, user_id, activity_type, description, metadata
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        comment.ticket_id, req.user.id, 'commented',
        `حذف تعليق${comment.is_internal ? ' داخلي' : ''}`,
        JSON.stringify({
          comment_id: id,
          action: 'deleted',
          deleted_by: req.user.id,
          original_author: comment.user_id,
          content_preview: comment.content.substring(0, 100)
        })
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'تم حذف التعليق بنجاح',
        data: {
          deleted_comment_id: id,
          ticket_number: comment.ticket_number
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('خطأ في حذف التعليق:', error);

      res.status(500).json({
        success: false,
        message: 'خطأ في حذف التعليق',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    } finally {
      client.release();
    }
  }
  
  // جلب تعليق واحد
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const { include_replies = 'false' } = req.query;

      const result = await pool.query(`
        SELECT
          tc.*,
          u.name as author_name,
          u.email as author_email,
          u.avatar_url as author_avatar,
          t.title as ticket_title,
          t.ticket_number,
          parent_tc.content as parent_content,
          parent_u.name as parent_author_name,
          (
            SELECT COUNT(*)
            FROM ticket_comments child
            WHERE child.parent_comment_id = tc.id
          ) as replies_count
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        JOIN tickets t ON tc.ticket_id = t.id
        LEFT JOIN ticket_comments parent_tc ON tc.parent_comment_id = parent_tc.id
        LEFT JOIN users parent_u ON parent_tc.user_id = parent_u.id
        WHERE tc.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التعليق غير موجود'
        });
      }

      const comment = result.rows[0];

      // معالجة البيانات
      const processedComment = {
        ...comment,
        attachments: comment.attachments || [],
        has_replies: comment.replies_count > 0,
        parent_comment: comment.parent_comment_id ? {
          id: comment.parent_comment_id,
          content: comment.parent_content ? comment.parent_content.substring(0, 100) + '...' : null,
          author_name: comment.parent_author_name
        } : null
      };

      // جلب الردود إذا طُلب ذلك
      if (include_replies === 'true' && comment.replies_count > 0) {
        const repliesResult = await pool.query(`
          SELECT
            tc.*,
            u.name as author_name,
            u.email as author_email,
            u.avatar_url as author_avatar
          FROM ticket_comments tc
          JOIN users u ON tc.user_id = u.id
          WHERE tc.parent_comment_id = $1
          ORDER BY tc.created_at ASC
        `, [id]);

        processedComment.replies = repliesResult.rows.map(reply => ({
          ...reply,
          attachments: reply.attachments || []
        }));
      }

      res.json({
        success: true,
        data: processedComment
      });
    } catch (error) {
      console.error('خطأ في جلب التعليق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التعليق',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
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
