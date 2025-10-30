const { pool } = require('../config/database');
const axios = require('axios');

class RecurringExecutionController {
  
  // تنفيذ قاعدة التكرار مع جميع الخطوات
  static async executeRule(req, res) {
    try {
      const { id } = req.params;
      
      console.log(`🔄 بدء تنفيذ قاعدة التكرار: ${id}`);
      
      // 1. جلب بيانات قاعدة التكرار
      const ruleResult = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1 AND rr.is_active = true
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة أو غير نشطة'
        });
      }
      
      const rule = ruleResult.rows[0];
      console.log(`📋 تم جلب قاعدة التكرار: ${rule.name}`);
      
      // التحقق من أن العملية لم تنته بعد
      if (rule.execution_count >= rule.recurrence_interval) {
        return res.status(400).json({
          success: false,
          message: 'تم الوصول للحد الأقصى من التنفيذات لهذه القاعدة'
        });
      }
      
      // 2. إنشاء التذكرة
      console.log('🎫 إنشاء التذكرة...');
      const ticketData = {
        title: rule.title,
        description: rule.description,
        process_id: rule.process_id,
        current_stage_id: rule.current_stage_id,
        priority: rule.priority || 'medium',
        status: rule.status || 'active',
        due_date: rule.due_date,
        data: rule.data || {},
        tags: rule.tags || []
      };
      
      let createdTicket;
      try {
        const ticketResponse = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/tickets`, ticketData, {
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json'
          }
        });
        
        createdTicket = ticketResponse.data.data;
        console.log(`✅ تم إنشاء التذكرة: ${createdTicket.ticket_number}`);
      } catch (error) {
        console.error('❌ خطأ في إنشاء التذكرة:', error.response?.data || error.message);
        throw new Error(`فشل إنشاء التذكرة: ${error.response?.data?.message || error.message}`);
      }
      
      // 3. إسناد المستخدم (إذا كان محدد)
      let assignmentResult = null;
      if (rule.assigned_to_id) {
        console.log('👤 إسناد المستخدم...');
        const assignmentData = {
          ticket_id: createdTicket.id,
          user_id: rule.assigned_to_id,
          role: 'assignee',
          assigned_by_notes: `تم الإسناد تلقائياً من قاعدة التكرار: ${rule.name}`
        };
        
        try {
          const assignmentResponse = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/ticket-assignments`, assignmentData, {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          });
          
          assignmentResult = assignmentResponse.data.data;
          console.log(`✅ تم إسناد المستخدم: ${rule.assigned_to_name}`);
        } catch (error) {
          console.error('⚠️ خطأ في إسناد المستخدم:', error.response?.data || error.message);
          // لا نوقف العملية، فقط نسجل الخطأ
        }
      }
      
      // 4. إرسال الإشعار (إذا كان هناك مستخدم مُسند)
      let notificationResult = null;
      if (rule.assigned_to_id) {
        console.log('🔔 إرسال الإشعار...');
        const notificationData = {
          user_ids: [rule.assigned_to_id],
          title: `تذكرة جديدة من قاعدة التكرار: ${rule.name}`,
          message: `تم إنشاء تذكرة جديدة "${createdTicket.title}" من قاعدة التكرار`,
          type: 'ticket_created',
          priority: 'medium',
          data: {
            ticket_id: createdTicket.id,
            ticket_title: createdTicket.title,
            ticket_number: createdTicket.ticket_number,
            recurring_rule_id: rule.id,
            recurring_rule_name: rule.name,
            created_from_recurring: true
          }
        };
        
        try {
          const notificationResponse = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3003'}/api/notifications/bulk`, notificationData, {
            headers: {
              'Authorization': req.headers.authorization,
              'Content-Type': 'application/json'
            }
          });
          
          notificationResult = notificationResponse.data;
          console.log(`✅ تم إرسال الإشعار للمستخدم`);
        } catch (error) {
          console.error('⚠️ خطأ في إرسال الإشعار:', error.response?.data || error.message);
          // لا نوقف العملية، فقط نسجل الخطأ
        }
      }
      
      // 5. تحديث قاعدة التكرار
      console.log('📊 تحديث قاعدة التكرار...');
      
      const newExecutionCount = rule.execution_count + 1;
      const isCompleted = newExecutionCount >= rule.recurrence_interval;
      
      // حساب التاريخ التالي للتنفيذ (إذا لم تكتمل العملية)
      let nextExecutionDate = null;
      let endDate = null;
      
      if (!isCompleted) {
        nextExecutionDate = RecurringExecutionController.calculateNextExecutionDate(rule);
      } else {
        // إذا اكتملت العملية، نضع تاريخ النهاية
        endDate = new Date();
      }
      
      // تحديث قاعدة التكرار
      const updateQuery = `
        UPDATE recurring_rules 
        SET 
          execution_count = $1,
          last_execution_date = NOW(),
          next_execution_date = $2,
          end_date = $3,
          is_active = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [
        newExecutionCount,
        nextExecutionDate,
        endDate,
        !isCompleted, // إذا اكتملت العملية، تصبح غير نشطة
        rule.id
      ]);
      
      const updatedRule = updateResult.rows[0];
      
      console.log(`📈 تم تحديث العداد: ${newExecutionCount}/${rule.recurrence_interval}`);
      if (isCompleted) {
        console.log(`🏁 تم إكمال جميع التنفيذات وإنهاء القاعدة`);
      } else {
        console.log(`⏰ التنفيذ التالي: ${nextExecutionDate}`);
      }
      
      // إرجاع النتيجة
      res.json({
        success: true,
        message: isCompleted 
          ? 'تم تنفيذ قاعدة التكرار وإكمال جميع التنفيذات المطلوبة'
          : 'تم تنفيذ قاعدة التكرار بنجاح',
        data: {
          rule: updatedRule,
          ticket: createdTicket,
          assignment: assignmentResult,
          notification: notificationResult,
          execution_info: {
            current_execution: newExecutionCount,
            total_executions: rule.recurrence_interval,
            is_completed: isCompleted,
            next_execution_date: nextExecutionDate,
            end_date: endDate
          }
        }
      });
      
    } catch (error) {
      console.error('❌ خطأ في تنفيذ قاعدة التكرار:', error);
      
      // في حالة الخطأ، نسجل محاولة فاشلة (اختياري)
      try {
        if (req.params.id) {
          await pool.query(`
            UPDATE recurring_rules 
            SET 
              last_execution_error = $1,
              updated_at = NOW()
            WHERE id = $2
          `, [error.message, req.params.id]);
        }
      } catch (logError) {
        console.error('خطأ في تسجيل الخطأ:', logError);
      }
      
      res.status(500).json({
        success: false,
        message: 'خطأ في تنفيذ قاعدة التكرار',
        error: error.message
      });
    }
  }
  
  // حساب التاريخ التالي للتنفيذ
  static calculateNextExecutionDate(rule) {
    const currentDate = new Date(rule.next_execution_date || rule.start_date);
    
    switch (rule.recurrence_type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
        
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
        
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
        
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
        
      default:
        // افتراضي: يومي
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return currentDate;
  }
  
  // جلب قاعدة التكرار وتنفيذها (endpoint مدمج)
  static async getAndExecute(req, res) {
    try {
      const { id } = req.params;
      
      // جلب البيانات أولاً
      const ruleResult = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      const rule = ruleResult.rows[0];
      
      // التحقق من إمكانية التنفيذ
      if (!rule.is_active) {
        return res.status(400).json({
          success: false,
          message: 'قاعدة التكرار غير نشطة',
          data: rule
        });
      }
      
      if (rule.execution_count >= rule.recurrence_interval) {
        return res.status(400).json({
          success: false,
          message: 'تم الوصول للحد الأقصى من التنفيذات',
          data: rule
        });
      }
      
      // تنفيذ القاعدة
      req.params.id = id; // للتأكد من وجود المعرف
      return await RecurringExecutionController.executeRule(req, res);
      
    } catch (error) {
      console.error('❌ خطأ في جلب وتنفيذ قاعدة التكرار:', error);
      console.error('📍 Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب وتنفيذ قاعدة التكرار',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = RecurringExecutionController;
