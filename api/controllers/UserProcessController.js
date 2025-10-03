const { UserProcess } = require('../models');

const UserProcessController = {
  // Create link (assign user to process)
  async create(req, res) {
    try {
      const { user_id, process_id, role } = req.body;
      if (!user_id || !process_id) {
        return res.status(400).json({ success: false, message: 'user_id و process_id مطلوبان' });
      }

      // التحقق من وجود المستخدم والعملية
      const { pool } = require('../config/database');
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL', [user_id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      const processCheck = await pool.query('SELECT id FROM processes WHERE id = $1 AND deleted_at IS NULL', [process_id]);
      if (processCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'العملية غير موجودة' });
      }

      const link = await UserProcess.create({ user_id, process_id, role, added_by: req.user?.id });
      return res.status(201).json({ success: true, data: link, message: 'تم ربط المستخدم بالعملية بنجاح' });
    } catch (error) {
      console.error('خطأ في إنشاء الربط:', error);
      if (error.code === '23503') {
        return res.status(400).json({ success: false, message: 'المستخدم أو العملية غير موجودة' });
      }
      return res.status(500).json({ success: false, message: 'خطأ في إنشاء الربط', error: error.message });
    }
  },

  // Get by id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const link = await UserProcess.findById(id);
      if (!link) return res.status(404).json({ success: false, message: 'الربط غير موجود' });
      return res.json({ success: true, data: link });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'خطأ في جلب الربط', error: error.message });
    }
  },

  // List with filters
  async list(req, res) {
    try {
      const { user_id, process_id, is_active } = req.query;
      const links = await UserProcess.findAll({ user_id, process_id, is_active: is_active === undefined ? undefined : is_active === 'true' });
      return res.json({ success: true, data: links });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'خطأ في جلب البيانات', error: error.message });
    }
  },

  // Update role / is_active
  async update(req, res) {
    try {
      const { id } = req.params;
      const link = await UserProcess.findById(id);
      if (!link) return res.status(404).json({ success: false, message: 'الربط غير موجود' });
      const updated = await link.update({ role: req.body.role, is_active: req.body.is_active });
      return res.json({ success: true, data: updated, message: 'تم التحديث بنجاح' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'خطأ في تحديث الربط', error: error.message });
    }
  },

  // Delete link
  async remove(req, res) {
    try {
      const { id } = req.params;
      const link = await UserProcess.findById(id);
      if (!link) return res.status(404).json({ success: false, message: 'الربط غير موجود' });
      await link.delete();
      return res.json({ success: true, message: 'تم حذف الربط بنجاح' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'خطأ في حذف الربط', error: error.message });
    }
  },

  // Helper: processes for a user
  async getProcessesForUser(req, res) {
    try {
      const { id } = req.params;
      const data = await UserProcess.getProcessesForUser(id);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'خطأ في جلب عمليات المستخدم', error: error.message });
    }
  },

  // Helper: users for a process
  async getUsersForProcess(req, res) {
    try {
      const { id } = req.params;
      const data = await UserProcess.getUsersForProcess(id);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'خطأ في جلب مستخدمي العملية', error: error.message });
    }
  },

  // تقرير شامل: جلب جميع المستخدمين مع العمليات التي يمتلكونها
  async getUsersWithProcesses(req, res) {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar_url,
          u.is_active as user_active,
          u.created_at as user_created_at,
          COALESCE(
            JSON_AGG(
              CASE 
                WHEN up.id IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'process_id', p.id,
                    'process_name', p.name,
                    'process_description', p.description,
                    'user_role', up.role,
                    'is_active', up.is_active,
                    'added_at', up.added_at,
                    'link_id', up.id
                  )
                ELSE NULL
              END
            ) FILTER (WHERE up.id IS NOT NULL), 
            '[]'::json
          ) as processes,
          COUNT(up.id) as processes_count
        FROM users u
        LEFT JOIN user_processes up ON u.id = up.user_id AND up.is_active = true
        LEFT JOIN processes p ON up.process_id = p.id AND p.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.name, u.email, u.avatar_url, u.is_active, u.created_at
        ORDER BY u.name ASC
      `;

      const result = await pool.query(query);
      
      // تنسيق البيانات
      const formattedData = result.rows.map(row => ({
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          avatar_url: row.avatar_url,
          is_active: row.user_active,
          created_at: row.user_created_at,
          processes_count: parseInt(row.processes_count)
        },
        processes: row.processes || []
      }));

      // إحصائيات إضافية
      const stats = {
        total_users: formattedData.length,
        users_with_processes: formattedData.filter(item => item.processes.length > 0).length,
        users_without_processes: formattedData.filter(item => item.processes.length === 0).length,
        total_assignments: formattedData.reduce((sum, item) => sum + item.processes.length, 0)
      };

      return res.json({ 
        success: true, 
        data: formattedData,
        stats,
        message: 'تم جلب المستخدمين والعمليات بنجاح'
      });

    } catch (error) {
      console.error('خطأ في جلب المستخدمين والعمليات:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب المستخدمين والعمليات', 
        error: error.message 
      });
    }
  },

  // تقرير مبسط: أسماء المستخدمين وأسماء العمليات فقط
  async getUsersProcessesSimple(req, res) {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          u.name as user_name,
          u.email as user_email,
          STRING_AGG(
            CASE 
              WHEN p.name IS NOT NULL 
              THEN p.name || ' (' || up.role || ')'
              ELSE NULL 
            END, 
            ', ' 
            ORDER BY p.name
          ) as processes_list,
          COUNT(up.id) as processes_count
        FROM users u
        LEFT JOIN user_processes up ON u.id = up.user_id AND up.is_active = true
        LEFT JOIN processes p ON up.process_id = p.id AND p.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.name, u.email
        ORDER BY u.name ASC
      `;

      const result = await pool.query(query);
      
      const formattedData = result.rows.map(row => ({
        user_name: row.user_name,
        user_email: row.user_email,
        processes_count: parseInt(row.processes_count),
        processes_list: row.processes_list || 'لا توجد عمليات'
      }));

      return res.json({ 
        success: true, 
        data: formattedData,
        message: 'تم جلب التقرير المبسط بنجاح'
      });

    } catch (error) {
      console.error('خطأ في جلب التقرير المبسط:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'خطأ في جلب التقرير المبسط', 
        error: error.message 
      });
    }
  }
};

module.exports = UserProcessController;
