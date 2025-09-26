const { pool } = require('./config/database');

async function checkAttachment() {
  try {
    const attachmentId = '77b1166f-5cc2-4de2-ac73-a65a2fd0c576';
    
    const result = await pool.query(
      'SELECT * FROM ticket_attachments WHERE id = $1', 
      [attachmentId]
    );
    
    if (result.rows.length > 0) {
      const attachment = result.rows[0];
      console.log('معلومات المرفق:');
      console.log('- معرف المرفق:', attachment.id);
      console.log('- اسم الملف:', attachment.original_filename);
      console.log('- مسار الملف:', attachment.file_path);
      console.log('- حجم الملف:', attachment.file_size);
      console.log('- نوع الملف:', attachment.mime_type);
      
      const fs = require('fs');
      const exists = fs.existsSync(attachment.file_path);
      console.log('- الملف موجود على القرص:', exists);
      
      if (!exists) {
        console.log('❌ الملف غير موجود على القرص!');
      }
    } else {
      console.log('❌ المرفق غير موجود في قاعدة البيانات');
    }
  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkAttachment();
