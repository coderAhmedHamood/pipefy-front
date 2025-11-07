const { pool } = require('../config/database');
require('dotenv').config();

async function updateTicketDescriptions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء تحديث أوصاف صلاحيات التذاكر...\n');

    const updates = [
      { action: 'manage', description: 'إدارة كاملة للتذاكر' },
      { action: 'read', description: 'عرض التذاكر' }
    ];

    for (const update of updates) {
      const result = await client.query(`
        UPDATE permissions
        SET description = $1
        WHERE resource = 'tickets' AND action = $2
        RETURNING name, resource, action, description
      `, [update.description, update.action]);
      
      if (result.rows.length > 0) {
        console.log(`✅ تم تحديث وصف: tickets.${update.action} → ${update.description}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ تم تحديث الأوصاف بنجاح!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  updateTicketDescriptions()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { updateTicketDescriptions };

