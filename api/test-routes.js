const express = require('express');
const app = express();

// Test loading routes
try {
  console.log('Loading routes...');
  
  const automationRoutes = require('./routes/automation');
  console.log('✅ Automation routes loaded');
  
  const recurringRoutes = require('./routes/recurring');
  console.log('✅ Recurring routes loaded');
  
  const commentRoutes = require('./routes/comments');
  console.log('✅ Comment routes loaded');
  
  const attachmentRoutes = require('./routes/attachments');
  console.log('✅ Attachment routes loaded');
  
  const auditRoutes = require('./routes/audit');
  console.log('✅ Audit routes loaded');
  
  const reportRoutes = require('./routes/reports');
  console.log('✅ Report routes loaded');
  
  // Register routes
  app.use('/api/automation', automationRoutes);
  app.use('/api/recurring', recurringRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/attachments', attachmentRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/reports', reportRoutes);
  
  console.log('✅ All routes registered successfully');
  
  // Test route
  app.get('/test', (req, res) => {
    res.json({ message: 'Test route working' });
  });
  
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log('Test endpoints:');
    console.log('- http://localhost:3001/test');
    console.log('- http://localhost:3001/api/automation/rules');
    console.log('- http://localhost:3001/api/recurring/rules');
    console.log('- http://localhost:3001/api/comments/search');
    console.log('- http://localhost:3001/api/attachments/search');
    console.log('- http://localhost:3001/api/audit/logs');
    console.log('- http://localhost:3001/api/reports/dashboard');
  });
  
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
}
