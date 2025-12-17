/**
 * Worker لتشغيل التذاكر المتكررة تلقائياً
 * يعمل بشكل مستقل ويفحص القواعد المستحقة كل دقيقة
 */

require('dotenv').config();
const RecurringExecutionService = require('../services/RecurringExecutionService');

class RecurringTicketsWorker {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // افتراضي: كل دقيقة (60 ثانية)
    this.isRunning = false;
    this.intervalId = null;
    this.stats = {
      total_checks: 0,
      total_executed: 0,
      total_errors: 0,
      last_check: null,
      last_execution: null
    };
  }

  // بدء Worker
  start() {
    if (this.isRunning) {
      console.log('⚠️  Worker يعمل بالفعل');
      return;
    }

    this.isRunning = true;
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🚀 بدء Worker للتذاكر المتكررة');
    console.log('═══════════════════════════════════════════════════════════════════');
    const intervalMinutes = this.interval / (60 * 1000);
    console.log(`⏱️  فترة الفحص: ${intervalMinutes} دقيقة`);
    console.log(`📊 سيتم فحص القواعد المستحقة كل ${intervalMinutes} دقيقة\n`);

    // تنفيذ فحص فوري عند البدء
    this.checkAndExecute();

    // جدولة الفحص الدوري
    this.intervalId = setInterval(() => {
      this.checkAndExecute();
    }, this.interval);

    // معالجة إشارة الإغلاق
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  // إيقاف Worker
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('\n⏹️  إيقاف Worker...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('✅ تم إيقاف Worker بنجاح');
    console.log('📊 إحصائيات نهائية:');
    console.log(`   - إجمالي الفحوصات: ${this.stats.total_checks}`);
    console.log(`   - إجمالي التنفيذات: ${this.stats.total_executed}`);
    console.log(`   - إجمالي الأخطاء: ${this.stats.total_errors}`);
    process.exit(0);
  }

  // فحص وتنفيذ القواعد المستحقة
  async checkAndExecute() {
    try {
      this.stats.total_checks++;
      this.stats.last_check = new Date().toISOString();

      // جلب القواعد المستحقة
      const dueRules = await RecurringExecutionService.getDueRules();

      if (dueRules.length === 0) {
        // لا توجد قواعد مستحقة - لا نطبع شيء لتقليل الضوضاء
        return;
      }

      console.log(`\n🔍 [${new Date().toLocaleString('ar-SA')}] تم العثور على ${dueRules.length} قاعدة مستحقة للتنفيذ`);

      // تنفيذ كل قاعدة
      for (const rule of dueRules) {
        try {
          console.log(`   ⚙️  جاري تنفيذ القاعدة: ${rule.name} (${rule.id.substring(0, 8)}...)`);
          
          const result = await RecurringExecutionService.executeRule(rule.id);

          if (result.success) {
            this.stats.total_executed++;
            this.stats.last_execution = new Date().toISOString();
            console.log(`   ✅ تم تنفيذ القاعدة بنجاح`);
            console.log(`      📝 التذكرة: ${result.ticket_number}`);
            console.log(`      🔢 التنفيذ: ${result.execution_count}/${result.max_executions || '∞'}`);
            if (result.next_execution) {
              console.log(`      ⏭️  التنفيذ التالي: ${new Date(result.next_execution).toLocaleString('ar-SA')}`);
            }
            if (result.is_completed) {
              console.log(`      ✅ تم إكمال جميع التنفيذات - تم تعطيل القاعدة`);
            }
          } else {
            this.stats.total_errors++;
            console.log(`   ❌ فشل تنفيذ القاعدة: ${result.message}`);
            if (result.error) {
              console.log(`      ⚠️  الخطأ: ${result.error}`);
            }
          }
        } catch (error) {
          this.stats.total_errors++;
          console.error(`   ❌ خطأ غير متوقع في تنفيذ القاعدة ${rule.id}:`, error.message);
        }
      }

    } catch (error) {
      this.stats.total_errors++;
      console.error('❌ خطأ في فحص القواعد المستحقة:', error);
    }
  }

  // الحصول على إحصائيات Worker
  getStats() {
    return {
      ...this.stats,
      is_running: this.isRunning,
      interval_minutes: this.interval / (60 * 1000)
    };
  }
}

// تشغيل Worker إذا تم تنفيذ الملف مباشرة
if (require.main === module) {
  // محاولة جلب الإعدادات من قاعدة البيانات
  let workerInterval = 60000; // افتراضي: 1 دقيقة = 60000 مللي ثانية
  
  (async () => {
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const intervalMinutes = settings.recurring_worker_interval || 1;
      workerInterval = intervalMinutes * 60 * 1000; // تحويل من دقائق إلى مللي ثانية
      
      // التحقق من القيمة
      if (intervalMinutes < 1) {
        console.warn(`⚠️  فترة Worker (${intervalMinutes} دقيقة) أقل من الحد الأدنى، سيتم استخدام 1 دقيقة`);
        workerInterval = 60000;
      } else if (intervalMinutes > 60) {
        console.warn(`⚠️  فترة Worker (${intervalMinutes} دقيقة) أكبر من الحد الأقصى، سيتم استخدام 60 دقيقة`);
        workerInterval = 3600000;
      }
    } catch (error) {
      console.warn('⚠️  تحذير: فشل جلب إعدادات Worker، سيتم استخدام القيمة الافتراضية');
      // استخدام متغير البيئة كبديل (بالمللي ثانية)
      const envInterval = parseInt(process.env.RECURRING_WORKER_INTERVAL);
      if (envInterval && envInterval >= 1000) {
        workerInterval = envInterval;
      }
    }
    
    const worker = new RecurringTicketsWorker({ interval: workerInterval });
    worker.start();
  })();

  // عرض الإحصائيات كل 5 دقائق
  setInterval(() => {
    const stats = worker.getStats();
    console.log('\n📊 إحصائيات Worker:');
    console.log(`   - إجمالي الفحوصات: ${stats.total_checks}`);
    console.log(`   - إجمالي التنفيذات: ${stats.total_executed}`);
    console.log(`   - إجمالي الأخطاء: ${stats.total_errors}`);
    console.log(`   - آخر فحص: ${stats.last_check ? new Date(stats.last_check).toLocaleString('ar-SA') : 'لا يوجد'}`);
    console.log(`   - آخر تنفيذ: ${stats.last_execution ? new Date(stats.last_execution).toLocaleString('ar-SA') : 'لا يوجد'}`);
  }, 5 * 60 * 1000); // كل 5 دقائق
}

module.exports = RecurringTicketsWorker;

