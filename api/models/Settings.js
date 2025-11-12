const { pool } = require('../config/database');

class Settings {
  constructor(data = {}) {
    this.id = data.id;
    // معلومات النظام الأساسية
    this.system_name = data.system_name;
    this.system_description = data.system_description;
    this.system_logo_url = data.system_logo_url;
    this.system_favicon_url = data.system_favicon_url;
    this.system_primary_color = data.system_primary_color;
    this.system_secondary_color = data.system_secondary_color;
    this.system_language = data.system_language;
    this.system_timezone = data.system_timezone;
    this.system_date_format = data.system_date_format;
    this.system_time_format = data.system_time_format;
    this.system_theme = data.system_theme;
    
    // إعدادات الإشعارات
    this.notifications_enabled = data.notifications_enabled;
    this.notifications_email_enabled = data.notifications_email_enabled;
    this.notifications_browser_enabled = data.notifications_browser_enabled;
    
    // إعدادات الأمان
    this.security_session_timeout = data.security_session_timeout;
    this.security_password_min_length = data.security_password_min_length;
    this.security_login_attempts_limit = data.security_login_attempts_limit;
    this.security_lockout_duration = data.security_lockout_duration;
    
    // إعدادات التكامل والبريد الإلكتروني
    this.integrations_email_smtp_host = data.integrations_email_smtp_host;
    this.integrations_email_smtp_port = data.integrations_email_smtp_port;
    this.integrations_email_smtp_username = data.integrations_email_smtp_username;
    this.integrations_email_smtp_password = data.integrations_email_smtp_password;
    this.integrations_email_from_address = data.integrations_email_from_address;
    this.integrations_email_from_name = data.integrations_email_from_name;
    this.integrations_email_enabled = data.integrations_email_enabled;
    this.integrations_email_send_delayed_tickets = data.integrations_email_send_delayed_tickets;
    this.integrations_email_send_on_assignment = data.integrations_email_send_on_assignment;
    this.integrations_email_send_on_comment = data.integrations_email_send_on_comment;
    this.integrations_email_send_on_completion = data.integrations_email_send_on_completion;
    this.integrations_email_send_on_creation = data.integrations_email_send_on_creation;
    this.integrations_email_send_on_update = data.integrations_email_send_on_update;
    this.integrations_email_send_on_move = data.integrations_email_send_on_move;
    this.integrations_email_send_on_review_assigned = data.integrations_email_send_on_review_assigned;
    this.integrations_email_send_on_review_updated = data.integrations_email_send_on_review_updated;
    
    // إعدادات النسخ الاحتياطي
    this.backup_enabled = data.backup_enabled;
    this.backup_frequency = data.backup_frequency;
    this.backup_retention_days = data.backup_retention_days;
    
    // إعدادات ساعات العمل
    this.working_hours_enabled = data.working_hours_enabled;
    
    // إعدادات الصيانة
    this.maintenance_mode = data.maintenance_mode;
    this.maintenance_message = data.maintenance_message;
    
    // إعدادات الملفات
    this.max_file_upload_size = data.max_file_upload_size;
    // معالجة allowed_file_types إذا كان JSON/JSONB
    if (data.allowed_file_types) {
      if (typeof data.allowed_file_types === 'string') {
        try {
          this.allowed_file_types = JSON.parse(data.allowed_file_types);
        } catch (e) {
          this.allowed_file_types = data.allowed_file_types;
        }
      } else if (Array.isArray(data.allowed_file_types)) {
        this.allowed_file_types = data.allowed_file_types;
      } else {
        this.allowed_file_types = data.allowed_file_types;
      }
    } else {
      this.allowed_file_types = data.allowed_file_types;
    }
    
    // إعدادات التذاكر
    this.default_ticket_priority = data.default_ticket_priority;
    this.auto_assign_tickets = data.auto_assign_tickets;
    this.ticket_numbering_format = data.ticket_numbering_format;
    
    // رابط الواجهة الأمامية (لروابط الإيميلات)
    this.frontend_url = data.frontend_url || 'http://localhost:8080';
    
    // رابط API الأساسي (للصور والملفات الثابتة)
    this.api_base_url = data.api_base_url || 'http://localhost:3004';
    
    // التواريخ
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  /**
   * جلب الإعدادات (صف واحد فقط)
   */
  static async getSettings() {
    try {
      const query = 'SELECT * FROM settings LIMIT 1';
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        // إنشاء إعدادات افتراضية إذا لم توجد
        return await this.createDefaultSettings();
      }

      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
      throw error;
    }
  }

  /**
   * إنشاء إعدادات افتراضية
   */
  static async createDefaultSettings() {
    try {
      const query = `
        INSERT INTO settings (
          system_name,
          system_description,
          security_login_attempts_limit,
          security_lockout_duration,
          integrations_email_smtp_host,
          integrations_email_smtp_port
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        'نظام إدارة المهام',
        'نظام شامل لإدارة المهام والعمليات التجارية',
        5,
        30,
        'smtp.gmail.com',
        587
      ];
      const result = await pool.query(query, values);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في إنشاء الإعدادات الافتراضية:', error);
      throw error;
    }
  }

  /**
   * تحديث الإعدادات - تحديث جميع الحقول بدون استثناء
   */
  static async updateSettings(settingsData) {
    try {
      // جلب الإعدادات الحالية
      const currentSettings = await this.getSettings();
      
      // بناء استعلام التحديث لجميع الحقول
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      // قائمة جميع الحقول القابلة للتحديث
      const allFields = [
        // معلومات النظام الأساسية
        'system_name', 'system_description', 'system_logo_url', 'system_favicon_url',
        'system_primary_color', 'system_secondary_color', 'system_language', 
        'system_timezone', 'system_date_format', 'system_time_format', 'system_theme',
        // إعدادات الإشعارات
        'notifications_enabled', 'notifications_email_enabled', 'notifications_browser_enabled',
        // إعدادات الأمان
        'security_session_timeout', 'security_password_min_length', 
        'security_login_attempts_limit', 'security_lockout_duration',
        // إعدادات البريد الإلكتروني
        'integrations_email_smtp_host', 'integrations_email_smtp_port',
        'integrations_email_smtp_username', 'integrations_email_smtp_password',
        'integrations_email_from_address', 'integrations_email_from_name',
        'integrations_email_enabled', 'integrations_email_send_delayed_tickets',
        'integrations_email_send_on_assignment', 'integrations_email_send_on_comment',
        'integrations_email_send_on_completion', 'integrations_email_send_on_creation',
        'integrations_email_send_on_update', 'integrations_email_send_on_move',
        'integrations_email_send_on_review_assigned', 'integrations_email_send_on_review_updated',
        // إعدادات النسخ الاحتياطي
        'backup_enabled', 'backup_frequency', 'backup_retention_days',
        // إعدادات ساعات العمل
        'working_hours_enabled',
        // إعدادات الصيانة
        'maintenance_mode', 'maintenance_message',
        // إعدادات الملفات
        'max_file_upload_size', 'allowed_file_types',
        // إعدادات التذاكر
        'default_ticket_priority', 'auto_assign_tickets', 'ticket_numbering_format',
        // رابط الواجهة الأمامية
        'frontend_url',
        // رابط API الأساسي
        'api_base_url'
      ];
      
      // تحديث جميع الحقول الممررة (حتى لو كانت undefined سيتم تحديثها إلى NULL)
      allFields.forEach(field => {
        if (settingsData.hasOwnProperty(field)) {
          // معالجة خاصة لكلمة المرور - التحقق قبل إضافة الحقل
          if (field === 'integrations_email_smtp_password') {
            const passwordValue = settingsData[field];
            // إذا كانت `***` أو فارغة، نحتفظ بالقيمة القديمة (لا نحدثها)
            if (passwordValue === null || passwordValue === undefined || passwordValue === '' || passwordValue === '***') {
              return; // تخطي هذا الحقل، لا نحدثه
            }
            // كلمة مرور جديدة، قم بإضافتها للتحديث
            updateFields.push(`${field} = $${paramCount}`);
            values.push(String(passwordValue));
            paramCount++;
            return;
          }
          
          // باقي الحقول
          updateFields.push(`${field} = $${paramCount}`);
          // معالجة المصفوفات والكائنات (مثل allowed_file_types)
          if (field === 'allowed_file_types') {
            // معالجة allowed_file_types - يجب أن تكون مصفوفة TEXT[] في PostgreSQL
            if (Array.isArray(settingsData[field])) {
              // إذا كانت مصفوفة، استخدمها مباشرة - node-postgres سيتعامل معها تلقائياً
              values.push(settingsData[field]);
            } else if (typeof settingsData[field] === 'string') {
              // إذا كانت سلسلة JSON، حاول تحويلها
              try {
                const parsed = JSON.parse(settingsData[field]);
                if (Array.isArray(parsed)) {
                  values.push(parsed);
                } else {
                  values.push(null);
                }
              } catch (e) {
                console.warn('⚠️ فشل في تحليل allowed_file_types من JSON:', e);
                // إذا فشل التحويل، حاول تقسيم السلسلة إلى مصفوفة
                if (settingsData[field].startsWith('[') && settingsData[field].endsWith(']')) {
                  try {
                    const cleanString = settingsData[field].replace(/[\[\]"]/g, '');
                    const arrayFromString = cleanString.split(',').map(item => item.trim()).filter(item => item);
                    values.push(arrayFromString);
                  } catch (e2) {
                    console.error('❌ فشل في تحويل allowed_file_types:', e2);
                    values.push(null);
                  }
                } else {
                  values.push(null);
                }
              }
            } else if (settingsData[field] === null || settingsData[field] === undefined) {
              values.push(null);
            } else {
              values.push(null);
            }
          } else {
            values.push(settingsData[field] === '' ? null : settingsData[field]);
          }
          paramCount++;
        }
      });
      
      // إذا لم يتم تمرير أي حقول للتحديث
      if (updateFields.length === 0) {
        return currentSettings;
      }
      
      // إضافة تحديث التاريخ
      updateFields.push(`updated_at = NOW()`);
      
      // إضافة معرف الصف للشرط
      values.push(currentSettings.id);
      
      const query = `
        UPDATE settings 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      throw error;
    }
  }

  /**
   * تحديث شعار النظام فقط
   */
  static async updateSystemLogo(logoPath) {
    try {
      const currentSettings = await this.getSettings();
      
      const query = `
        UPDATE settings 
        SET 
          system_logo_url = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [logoPath, currentSettings.id]);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في تحديث شعار النظام:', error);
      throw error;
    }
  }

  /**
   * حذف شعار النظام
   */
  static async removeSystemLogo() {
    try {
      const currentSettings = await this.getSettings();
      
      const query = `
        UPDATE settings 
        SET 
          system_logo_url = NULL,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [currentSettings.id]);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في حذف شعار النظام:', error);
      throw error;
    }
  }

  /**
   * تحويل إلى JSON (إخفاء كلمات المرور الحساسة)
   */
  toJSON() {
    const settings = { ...this };
    // إخفاء كلمات المرور الحساسة في الاستجابة
    if (settings.integrations_email_smtp_password) {
      settings.integrations_email_smtp_password = '***';
    }
    if (settings.integrations_api_key) {
      settings.integrations_api_key = '***';
    }
    if (settings.backup_cloud_credentials) {
      settings.backup_cloud_credentials = '***';
    }
    return settings;
  }
}

module.exports = Settings;
