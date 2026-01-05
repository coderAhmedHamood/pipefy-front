/**
 * Script لإضافة الأعمدة المفقودة إلى جدول recurring_rules
 * تشغيل: node scripts/add-recurring-rules-columns.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function addColumns() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 بدء إضافة الأعمدة إلى جدول recurring_rules...\n');
    
    // إضافة عمود data
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'
      `);
      console.log('✅ عمود data: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود data:', error.message);
    }
    
    // إضافة عمود title
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS title VARCHAR(500)
      `);
      console.log('✅ عمود title: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود title:', error.message);
    }
    
    // إضافة عمود recurrence_type
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(50) DEFAULT 'daily'
      `);
      console.log('✅ عمود recurrence_type: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود recurrence_type:', error.message);
    }
    
    // إضافة عمود recurrence_interval
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1
      `);
      console.log('✅ عمود recurrence_interval: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود recurrence_interval:', error.message);
    }
    
    // إضافة عمود month_day
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS month_day INTEGER
      `);
      console.log('✅ عمود month_day: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود month_day:', error.message);
    }
    
    // إضافة عمود weekdays
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS weekdays INTEGER[]
      `);
      console.log('✅ عمود weekdays: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود weekdays:', error.message);
    }
    
    // إضافة عمود next_execution_date
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS next_execution_date TIMESTAMPTZ
      `);
      console.log('✅ عمود next_execution_date: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود next_execution_date:', error.message);
    }
    
    // إضافة عمود last_execution_date
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS last_execution_date TIMESTAMPTZ
      `);
      console.log('✅ عمود last_execution_date: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود last_execution_date:', error.message);
    }
    
    // إضافة عمود start_date
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW()
      `);
      console.log('✅ عمود start_date: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود start_date:', error.message);
    }
    
    // إضافة عمود priority
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'
      `);
      console.log('✅ عمود priority: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود priority:', error.message);
    }
    
    // إضافة عمود status
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
      `);
      console.log('✅ عمود status: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود status:', error.message);
    }
    
    // إضافة عمود assigned_to
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS assigned_to UUID
      `);
      console.log('✅ عمود assigned_to: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود assigned_to:', error.message);
    }
    
    // إضافة عمود execution_count
    try {
      await client.query(`
        ALTER TABLE recurring_rules 
        ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0
      `);
      console.log('✅ عمود execution_count: موجود أو تم إضافته');
    } catch (error) {
      console.log('⚠️  عمود execution_count:', error.message);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ تم إضافة جميع الأعمدة بنجاح!');
    
    // التحقق من الأعمدة
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'recurring_rules' 
      AND column_name IN ('data', 'title', 'recurrence_type', 'recurrence_interval', 'month_day', 'weekdays')
      ORDER BY column_name
    `);
    
    console.log('\n📋 الأعمدة الموجودة:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل
addColumns()
  .then(() => {
    console.log('\n🎉 اكتمل بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل:', error);
    process.exit(1);
  });

