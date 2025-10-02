const { pool } = require('./config/database');

async function checkTicketsSchema() {
  try {
    console.log('🔍 فحص schema جدول tickets...');
    
    // فحص أعمدة جدول tickets
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tickets' 
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(schemaQuery);
    
    console.log('\n📋 أعمدة جدول tickets:');
    console.log('=====================================');
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // فحص وجود عمود deleted_at
    const hasDeletedAt = result.rows.some(col => col.column_name === 'deleted_at');
    console.log(`\n❓ هل يحتوي على deleted_at؟ ${hasDeletedAt ? '✅ نعم' : '❌ لا'}`);
    
    // فحص عدد التذاكر الموجودة
    const countQuery = 'SELECT COUNT(*) as total FROM tickets';
    const countResult = await pool.query(countQuery);
    console.log(`\n📊 إجمالي التذاكر: ${countResult.rows[0].total}`);
    
    // فحص أرقام التذاكر الموجودة
    const numbersQuery = 'SELECT ticket_number FROM tickets ORDER BY created_at DESC LIMIT 10';
    const numbersResult = await pool.query(numbersQuery);
    console.log('\n🎫 آخر 10 أرقام تذاكر:');
    numbersResult.rows.forEach(ticket => {
      console.log(`- ${ticket.ticket_number}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في فحص schema:', error.message);
  } finally {
    await pool.end();
  }
}

checkTicketsSchema();
