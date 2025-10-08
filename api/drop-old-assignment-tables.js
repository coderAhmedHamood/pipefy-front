const { pool } = require('./config/database');

async function dropTables() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  حذف الجداول القديمة...\n');

    await client.query(`DROP TABLE IF EXISTS ticket_evaluation_summary CASCADE`);
    console.log('✅ حذف ticket_evaluation_summary');
    
    await client.query(`DROP TABLE IF EXISTS ticket_evaluations CASCADE`);
    console.log('✅ حذف ticket_evaluations');
    
    await client.query(`DROP TABLE IF EXISTS evaluation_criteria CASCADE`);
    console.log('✅ حذف evaluation_criteria');
    
    await client.query(`DROP TABLE IF EXISTS ticket_reviewers CASCADE`);
    console.log('✅ حذف ticket_reviewers');
    
    await client.query(`DROP TABLE IF EXISTS ticket_assignments CASCADE`);
    console.log('✅ حذف ticket_assignments');

    console.log('\n✅ تم حذف جميع الجداول القديمة بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

dropTables()
  .then(() => {
    console.log('\n✨ اكتملت العملية!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشلت العملية:', error);
    process.exit(1);
  });
