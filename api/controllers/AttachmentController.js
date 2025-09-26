const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/attachments');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // حد أقصى 5 ملفات
  },
  fileFilter: (req, file, cb) => {
    // أنواع الملفات المسموحة
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'), false);
    }
  }
});

class AttachmentController {
  // جلب مرفقات تذكرة
  static async getTicketAttachments(req, res) {
    try {
      const { ticket_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const result = await pool.query(`
        SELECT 
          ta.*,
          u.name as uploaded_by_name,
          u.email as uploaded_by_email
        FROM ticket_attachments ta
        JOIN users u ON ta.uploaded_by = u.id
        WHERE ta.ticket_id = $1
        ORDER BY ta.created_at DESC
        LIMIT $2 OFFSET $3
      `, [ticket_id, limit, offset]);
      
      const countResult = await pool.query(`
        SELECT COUNT(*) as total FROM ticket_attachments WHERE ticket_id = $1
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
      console.error('خطأ في جلب المرفقات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المرفقات',
        error: error.message
      });
    }
  }
  
  // رفع مرفقات جديدة
  static async upload(req, res) {
    const uploadMiddleware = upload.array('files', 5);
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'خطأ في رفع الملف',
          error: err.message
        });
      }
      
      try {
        const { ticket_id } = req.params;
        const { description } = req.body;
        
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'لم يتم رفع أي ملفات'
          });
        }
        
        // التحقق من وجود التذكرة
        const ticketCheck = await pool.query(`
          SELECT id FROM tickets WHERE id = $1
        `, [ticket_id]);
        
        if (ticketCheck.rows.length === 0) {
          // حذف الملفات المرفوعة
          for (const file of req.files) {
            await fs.unlink(file.path).catch(() => {});
          }
          
          return res.status(404).json({
            success: false,
            message: 'التذكرة غير موجودة'
          });
        }
        
        const attachments = [];
        
        for (const file of req.files) {
          const result = await pool.query(`
            INSERT INTO ticket_attachments (
              ticket_id, filename, original_filename, file_path,
              file_size, mime_type, description, uploaded_by, user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `, [
            ticket_id,
            file.filename,
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            description || null,
            req.user.id,
            req.user.id
          ]);
          
          attachments.push(result.rows[0]);
        }
        
        // إضافة نشاط للتذكرة
        await pool.query(`
          INSERT INTO ticket_activities (
            ticket_id, user_id, activity_type, description, metadata
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [
          ticket_id, req.user.id, 'attachment_added',
          `رفع ${attachments.length} مرفق${attachments.length > 1 ? 'ات' : ''}`,
          JSON.stringify({
            attachment_count: attachments.length,
            attachment_ids: attachments.map(a => a.id)
          })
        ]);
        
        res.status(201).json({
          success: true,
          message: `تم رفع ${attachments.length} مرفق بنجاح`,
          data: attachments
        });
      } catch (error) {
        // حذف الملفات في حالة الخطأ
        if (req.files) {
          for (const file of req.files) {
            await fs.unlink(file.path).catch(() => {});
          }
        }
        
        console.error('خطأ في رفع المرفقات:', error);
        res.status(500).json({
          success: false,
          message: 'خطأ في رفع المرفقات',
          error: error.message
        });
      }
    });
  }
  
  // تحميل مرفق
  static async download(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT * FROM ticket_attachments WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المرفق غير موجود'
        });
      }
      
      const attachment = result.rows[0];
      
      // التحقق من وجود الملف
      try {
        await fs.access(attachment.file_path);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'الملف غير موجود على الخادم'
        });
      }
      
      // تسجيل نشاط التحميل (اختياري)
      // يمكن إضافة تسجيل نشاط التحميل هنا إذا لزم الأمر
      
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`);
      res.setHeader('Content-Type', attachment.mime_type);
      res.sendFile(path.resolve(attachment.file_path));
      
    } catch (error) {
      console.error('خطأ في تحميل المرفق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحميل المرفق',
        error: error.message
      });
    }
  }
  
  // حذف مرفق
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT * FROM ticket_attachments WHERE id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المرفق غير موجود'
        });
      }
      
      const attachment = result.rows[0];
      
      // التحقق من الصلاحية (المرفوع أو مدير)
      if (attachment.uploaded_by !== req.user.id && !req.user.is_admin) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بحذف هذا المرفق'
        });
      }
      
      // حذف الملف من النظام
      try {
        await fs.unlink(attachment.file_path);
      } catch (error) {
        console.warn('تعذر حذف الملف من النظام:', error.message);
      }
      
      // حذف السجل من قاعدة البيانات
      await pool.query(`
        DELETE FROM ticket_attachments WHERE id = $1
      `, [id]);
      
      // إضافة نشاط للتذكرة
      await pool.query(`
        INSERT INTO ticket_activities (
          ticket_id, user_id, activity_type, description, metadata
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        attachment.ticket_id, req.user.id, 'attachment_deleted',
        `حذف مرفق: ${attachment.original_filename}`,
        JSON.stringify({
          attachment_id: id,
          filename: attachment.original_filename
        })
      ]);
      
      res.json({
        success: true,
        message: 'تم حذف المرفق بنجاح',
        data: {
          id: attachment.id,
          original_filename: attachment.original_filename,
          deleted_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('خطأ في حذف المرفق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف المرفق',
        error: error.message
      });
    }
  }
  
  // جلب معلومات مرفق
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT 
          ta.*,
          u.name as uploaded_by_name,
          u.email as uploaded_by_email,
          t.title as ticket_title,
          t.ticket_number
        FROM ticket_attachments ta
        JOIN users u ON ta.uploaded_by = u.id
        JOIN tickets t ON ta.ticket_id = t.id
        WHERE ta.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المرفق غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في جلب معلومات المرفق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب معلومات المرفق',
        error: error.message
      });
    }
  }
  
  // البحث في المرفقات
  static async search(req, res) {
    try {
      const { 
        q, 
        ticket_id, 
        mime_type, 
        uploaded_by,
        page = 1, 
        limit = 20 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          ta.*,
          u.name as uploaded_by_name,
          t.title as ticket_title,
          t.ticket_number
        FROM ticket_attachments ta
        JOIN users u ON ta.uploaded_by = u.id
        JOIN tickets t ON ta.ticket_id = t.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (q) {
        paramCount++;
        query += ` AND (ta.original_filename ILIKE $${paramCount} OR ta.description ILIKE $${paramCount})`;
        params.push(`%${q}%`);
      }
      
      if (ticket_id) {
        paramCount++;
        query += ` AND ta.ticket_id = $${paramCount}`;
        params.push(ticket_id);
      }
      
      if (mime_type) {
        paramCount++;
        query += ` AND ta.mime_type LIKE $${paramCount}`;
        params.push(`${mime_type}%`);
      }
      
      if (uploaded_by) {
        paramCount++;
        query += ` AND ta.uploaded_by = $${paramCount}`;
        params.push(uploaded_by);
      }
      
      query += ` 
        ORDER BY ta.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('خطأ في البحث في المرفقات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث في المرفقات',
        error: error.message
      });
    }
  }
}

module.exports = AttachmentController;
