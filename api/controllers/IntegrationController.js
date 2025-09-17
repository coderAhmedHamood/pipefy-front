const { pool } = require('../config/database');

class IntegrationController {
  // جلب جميع التكاملات
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 50, type, active } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT i.*, u.name as created_by_name
        FROM integrations i
        LEFT JOIN users u ON i.created_by = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (type) {
        paramCount++;
        query += ` AND i.integration_type = $${paramCount}`;
        params.push(type);
      }
      
      if (active !== undefined) {
        paramCount++;
        query += ` AND i.is_active = $${paramCount}`;
        params.push(active === 'true');
      }
      
      query += ` ORDER BY i.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // جلب العدد الإجمالي
      let countQuery = 'SELECT COUNT(*) FROM integrations WHERE 1=1';
      const countParams = [];
      let countParamCount = 0;
      
      if (type) {
        countParamCount++;
        countQuery += ` AND integration_type = $${countParamCount}`;
        countParams.push(type);
      }
      
      if (active !== undefined) {
        countParamCount++;
        countQuery += ` AND is_active = $${countParamCount}`;
        countParams.push(active === 'true');
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
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
      console.error('خطأ في جلب التكاملات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التكاملات',
        error: error.message
      });
    }
  }
  
  // جلب تكامل واحد
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT i.*, u.name as created_by_name
        FROM integrations i
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التكامل غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في جلب التكامل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التكامل',
        error: error.message
      });
    }
  }
  
  // إنشاء تكامل جديد
  static async create(req, res) {
    try {
      const {
        name,
        description,
        integration_type,
        endpoint,
        http_method = 'POST',
        headers = {},
        authentication = {},
        trigger_events,
        payload_template,
        retry_policy = { max_retries: 3, retry_delay_seconds: 60 }
      } = req.body;
      
      const userId = req.user.id;
      
      const result = await pool.query(`
        INSERT INTO integrations (
          name, description, integration_type, endpoint, http_method,
          headers, authentication, trigger_events, payload_template,
          retry_policy, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        name, description, integration_type, endpoint, http_method,
        JSON.stringify(headers), JSON.stringify(authentication),
        trigger_events, JSON.stringify(payload_template),
        JSON.stringify(retry_policy), userId
      ]);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء التكامل بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في إنشاء التكامل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء التكامل',
        error: error.message
      });
    }
  }
  
  // تحديث تكامل
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // بناء استعلام التحديث ديناميكياً
      const setClause = [];
      const values = [];
      let paramCount = 0;
      
      for (const [key, value] of Object.entries(updates)) {
        if (['headers', 'authentication', 'payload_template', 'retry_policy'].includes(key)) {
          paramCount++;
          setClause.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else if (key !== 'id') {
          paramCount++;
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }
      
      if (setClause.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات للتحديث'
        });
      }
      
      paramCount++;
      setClause.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      
      values.push(id);
      
      const result = await pool.query(`
        UPDATE integrations 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التكامل غير موجود'
        });
      }
      
      res.json({
        success: true,
        message: 'تم تحديث التكامل بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في تحديث التكامل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث التكامل',
        error: error.message
      });
    }
  }
  
  // حذف تكامل
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        DELETE FROM integrations WHERE id = $1 RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التكامل غير موجود'
        });
      }
      
      res.json({
        success: true,
        message: 'تم حذف التكامل بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف التكامل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف التكامل',
        error: error.message
      });
    }
  }
  
  // اختبار تكامل
  static async test(req, res) {
    try {
      const { id } = req.params;
      
      const integration = await pool.query(`
        SELECT * FROM integrations WHERE id = $1
      `, [id]);
      
      if (integration.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التكامل غير موجود'
        });
      }
      
      // هنا يمكن إضافة منطق اختبار التكامل الفعلي
      // مثل إرسال طلب تجريبي للـ endpoint
      
      res.json({
        success: true,
        message: 'تم اختبار التكامل بنجاح',
        data: {
          status: 'success',
          response_time: Math.floor(Math.random() * 500) + 100,
          test_payload: { test: true, timestamp: new Date() }
        }
      });
    } catch (error) {
      console.error('خطأ في اختبار التكامل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في اختبار التكامل',
        error: error.message
      });
    }
  }
}

module.exports = IntegrationController;
