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
    this.allowed_file_types = data.allowed_file_types;
    
    // إعدادات التذاكر
    this.default_ticket_priority = data.default_ticket_priority;
    this.auto_assign_tickets = data.auto_assign_tickets;
    this.ticket_numbering_format = data.ticket_numbering_format;
    
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
   * تحديث الإعدادات
   */
  static async updateSettings(settingsData) {
    try {
      // جلب الإعدادات الحالية
      const currentSettings = await this.getSettings();
      
      // بناء استعلام التحديث ديناميكياً
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      // معلومات النظام الأساسية
      if (settingsData.system_name !== undefined) {
        updateFields.push(`system_name = $${paramCount}`);
        values.push(settingsData.system_name);
        paramCount++;
      }
      
      if (settingsData.system_description !== undefined) {
        updateFields.push(`system_description = $${paramCount}`);
        values.push(settingsData.system_description);
        paramCount++;
      }
      
      if (settingsData.system_logo_url !== undefined) {
        updateFields.push(`system_logo_url = $${paramCount}`);
        values.push(settingsData.system_logo_url);
        paramCount++;
      }
      
      if (settingsData.system_primary_color !== undefined) {
        updateFields.push(`system_primary_color = $${paramCount}`);
        values.push(settingsData.system_primary_color);
        paramCount++;
      }
      
      if (settingsData.system_secondary_color !== undefined) {
        updateFields.push(`system_secondary_color = $${paramCount}`);
        values.push(settingsData.system_secondary_color);
        paramCount++;
      }
      
      if (settingsData.system_language !== undefined) {
        updateFields.push(`system_language = $${paramCount}`);
        values.push(settingsData.system_language);
        paramCount++;
      }
      
      if (settingsData.system_timezone !== undefined) {
        updateFields.push(`system_timezone = $${paramCount}`);
        values.push(settingsData.system_timezone);
        paramCount++;
      }
      
      // إعدادات الأمان
      if (settingsData.security_login_attempts_limit !== undefined) {
        updateFields.push(`security_login_attempts_limit = $${paramCount}`);
        values.push(settingsData.security_login_attempts_limit);
        paramCount++;
      }
      
      if (settingsData.security_lockout_duration !== undefined) {
        updateFields.push(`security_lockout_duration = $${paramCount}`);
        values.push(settingsData.security_lockout_duration);
        paramCount++;
      }
      
      if (settingsData.security_session_timeout !== undefined) {
        updateFields.push(`security_session_timeout = $${paramCount}`);
        values.push(settingsData.security_session_timeout);
        paramCount++;
      }
      
      if (settingsData.security_password_min_length !== undefined) {
        updateFields.push(`security_password_min_length = $${paramCount}`);
        values.push(settingsData.security_password_min_length);
        paramCount++;
      }
      
      // إعدادات البريد الإلكتروني
      if (settingsData.integrations_email_smtp_host !== undefined) {
        updateFields.push(`integrations_email_smtp_host = $${paramCount}`);
        values.push(settingsData.integrations_email_smtp_host);
        paramCount++;
      }
      
      if (settingsData.integrations_email_smtp_port !== undefined) {
        updateFields.push(`integrations_email_smtp_port = $${paramCount}`);
        values.push(settingsData.integrations_email_smtp_port);
        paramCount++;
      }
      
      if (settingsData.integrations_email_smtp_username !== undefined) {
        updateFields.push(`integrations_email_smtp_username = $${paramCount}`);
        values.push(settingsData.integrations_email_smtp_username);
        paramCount++;
      }
      
      if (settingsData.integrations_email_smtp_password !== undefined) {
        updateFields.push(`integrations_email_smtp_password = $${paramCount}`);
        values.push(settingsData.integrations_email_smtp_password);
        paramCount++;
      }
      
      if (settingsData.integrations_email_from_address !== undefined) {
        updateFields.push(`integrations_email_from_address = $${paramCount}`);
        values.push(settingsData.integrations_email_from_address);
        paramCount++;
      }
      
      if (settingsData.integrations_email_from_name !== undefined) {
        updateFields.push(`integrations_email_from_name = $${paramCount}`);
        values.push(settingsData.integrations_email_from_name);
        paramCount++;
      }
      
      // إعدادات الإشعارات
      if (settingsData.notifications_enabled !== undefined) {
        updateFields.push(`notifications_enabled = $${paramCount}`);
        values.push(settingsData.notifications_enabled);
        paramCount++;
      }
      
      if (settingsData.notifications_email_enabled !== undefined) {
        updateFields.push(`notifications_email_enabled = $${paramCount}`);
        values.push(settingsData.notifications_email_enabled);
        paramCount++;
      }
      
      // إعدادات الصيانة
      if (settingsData.maintenance_mode !== undefined) {
        updateFields.push(`maintenance_mode = $${paramCount}`);
        values.push(settingsData.maintenance_mode);
        paramCount++;
      }
      
      if (settingsData.maintenance_message !== undefined) {
        updateFields.push(`maintenance_message = $${paramCount}`);
        values.push(settingsData.maintenance_message);
        paramCount++;
      }
      
      // إعدادات التذاكر
      if (settingsData.default_ticket_priority !== undefined) {
        updateFields.push(`default_ticket_priority = $${paramCount}`);
        values.push(settingsData.default_ticket_priority);
        paramCount++;
      }
      
      if (settingsData.auto_assign_tickets !== undefined) {
        updateFields.push(`auto_assign_tickets = $${paramCount}`);
        values.push(settingsData.auto_assign_tickets);
        paramCount++;
      }
      
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
