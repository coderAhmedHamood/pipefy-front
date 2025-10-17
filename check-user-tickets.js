import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pipefy-main',
  user: 'postgres',
  password: '123456'
});

async function checkUserTickets() {
  try {
    // 1. جلب جميع التذاكر
    const allTickets = await pool.query(`
      SELECT id, ticket_number, title, assigned_to, created_at, status 
      FROM tickets 
      WHERE deleted_at IS NULL 
      LIMIT 10
    `);
    
    console.log('\n=== جميع التذاكر ===');
    console.log('العدد الكلي:', allTickets.rowCount);
    console.log(JSON.stringify(allTickets.rows, null, 2));
    
    // 2. جلب تذاكر المستخدم المحدد
    const userId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';
    const userTickets = await pool.query(`
      SELECT id, ticket_number, title, assigned_to, created_at, status 
      FROM tickets 
      WHERE assigned_to = $1 
      AND deleted_at IS NULL
    `, [userId]);
    
    console.log('\n=== تذاكر المستخدم ===');
    console.log('User ID:', userId);
    console.log('العدد:', userTickets.rowCount);
    console.log(JSON.stringify(userTickets.rows, null, 2));
    
    // 3. فحص الفترة الزمنية
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = new Date().toISOString();
    
    const ticketsInPeriod = await pool.query(`
      SELECT id, ticket_number, title, assigned_to, created_at, status 
      FROM tickets 
      WHERE assigned_to = $1 
      AND created_at BETWEEN $2 AND $3
      AND deleted_at IS NULL
    `, [userId, dateFrom, dateTo]);
    
    console.log('\n=== تذاكر المستخدم في الفترة ===');
    console.log('من:', dateFrom);
    console.log('إلى:', dateTo);
    console.log('العدد:', ticketsInPeriod.rowCount);
    console.log(JSON.stringify(ticketsInPeriod.rows, null, 2));
    
  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserTickets();
