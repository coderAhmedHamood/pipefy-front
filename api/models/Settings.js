const { pool } = require('../config/database');

class Settings {
  constructor(data = {}) {
    this.id = data.id;
    this.company_name = data.company_name;
    this.company_logo = data.company_logo;
    this.login_attempts_limit = data.login_attempts_limit;
    this.lockout_duration_minutes = data.lockout_duration_minutes;
    this.smtp_server = data.smtp_server;
    this.smtp_port = data.smtp_port;
    this.smtp_username = data.smtp_username;
    this.smtp_password = data.smtp_password;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
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
          company_name,
          login_attempts_limit,
          lockout_duration_minutes,
          smtp_server,
          smtp_port
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = ['كلين لايف', 5, 30, 'smtp.gmail.com', 587];
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
      
      const query = `
        UPDATE settings 
        SET 
          company_name = COALESCE($1, company_name),
          company_logo = COALESCE($2, company_logo),
          login_attempts_limit = COALESCE($3, login_attempts_limit),
          lockout_duration_minutes = COALESCE($4, lockout_duration_minutes),
          smtp_server = COALESCE($5, smtp_server),
          smtp_port = COALESCE($6, smtp_port),
          smtp_username = COALESCE($7, smtp_username),
          smtp_password = COALESCE($8, smtp_password),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `;

      const values = [
        settingsData.company_name,
        settingsData.company_logo,
        settingsData.login_attempts_limit,
        settingsData.lockout_duration_minutes,
        settingsData.smtp_server,
        settingsData.smtp_port,
        settingsData.smtp_username,
        settingsData.smtp_password,
        currentSettings.id
      ];

      const result = await pool.query(query, values);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      throw error;
    }
  }

  /**
   * تحديث شعار الشركة فقط
   */
  static async updateCompanyLogo(logoPath) {
    try {
      const currentSettings = await this.getSettings();
      
      const query = `
        UPDATE settings 
        SET 
          company_logo = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [logoPath, currentSettings.id]);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في تحديث شعار الشركة:', error);
      throw error;
    }
  }

  /**
   * حذف شعار الشركة
   */
  static async removeCompanyLogo() {
    try {
      const currentSettings = await this.getSettings();
      
      const query = `
        UPDATE settings 
        SET 
          company_logo = NULL,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [currentSettings.id]);
      return new Settings(result.rows[0]);
    } catch (error) {
      console.error('خطأ في حذف شعار الشركة:', error);
      throw error;
    }
  }

  /**
   * تحويل إلى JSON (إخفاء كلمة مرور SMTP)
   */
  toJSON() {
    const settings = { ...this };
    // إخفاء كلمة مرور SMTP في الاستجابة
    if (settings.smtp_password) {
      settings.smtp_password = '***';
    }
    return settings;
  }
}

module.exports = Settings;
