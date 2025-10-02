const { pool } = require('./config/database');

async function testTicketCreationFinal() {
  console.log('🔄 Testing database connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Test the Ticket model directly
    const Ticket = require('./models/Ticket');
    
    console.log('\n🧪 Testing ticket creation with the fixed model...');
    
    // Get a process and user for testing
    const processQuery = `SELECT id, name FROM processes LIMIT 1`;
    const processResult = await client.query(processQuery);
    
    if (processResult.rows.length === 0) {
      console.log('❌ No processes found in the system');
      client.release();
      return;
    }
    
    const process = processResult.rows[0];
    console.log(`📋 Using process: ${process.name} (${process.id})`);
    
    const userQuery = `SELECT id, name FROM users LIMIT 1`;
    const userResult = await client.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in the system');
      client.release();
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`👤 Using user: ${user.name} (${user.id})`);
    
    client.release();
    
    console.log('\n🚀 Creating multiple tickets to test uniqueness...');
    
    const createdTickets = [];
    const errors = [];
    
    // Create tickets sequentially
    for (let i = 1; i <= 5; i++) {
      console.log(`\n📝 Creating ticket ${i}...`);
      
      try {
        const ticketData = {
          title: `Test Ticket ${i}`,
          description: `Description for test ticket ${i}`,
          process_id: process.id,
          created_by: user.id,
          priority: 'medium',
          data: { test: true, number: i }
        };
        
        const ticket = await Ticket.create(ticketData);
        createdTickets.push(ticket);
        console.log(`  ✅ Created ticket: ${ticket.ticket_number}`);
        
      } catch (error) {
        errors.push({ ticket: i, error: error.message });
        console.log(`  ❌ Failed to create ticket ${i}: ${error.message}`);
      }
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Results Summary:');
    console.log(`✅ Successfully created: ${createdTickets.length} tickets`);
    console.log(`❌ Failed to create: ${errors.length} tickets`);
    
    if (createdTickets.length > 0) {
      console.log('\n📋 Created tickets:');
      createdTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      });
      
      // Check for duplicates
      const ticketNumbers = createdTickets.map(t => t.ticket_number);
      const uniqueNumbers = [...new Set(ticketNumbers)];
      
      if (ticketNumbers.length === uniqueNumbers.length) {
        console.log('\n✅ All ticket numbers are unique - No duplicates found!');
      } else {
        console.log('\n❌ Duplicate ticket numbers found!');
        const duplicates = ticketNumbers.filter((num, index) => ticketNumbers.indexOf(num) !== index);
        console.log('Duplicate numbers:', duplicates);
      }
    }
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`  Ticket ${err.ticket}: ${err.error}`);
      });
    }
    
    // Test concurrent creation
    console.log('\n🔄 Testing concurrent ticket creation...');
    
    const concurrentPromises = [];
    for (let i = 1; i <= 3; i++) {
      const ticketData = {
        title: `Concurrent Test Ticket ${i}`,
        description: `Concurrent test ${i}`,
        process_id: process.id,
        created_by: user.id,
        priority: 'high',
        data: { concurrent_test: true, number: i }
      };
      
      concurrentPromises.push(
        Ticket.create(ticketData)
          .then(ticket => ({ success: true, ticket }))
          .catch(error => ({ success: false, error: error.message }))
      );
    }
    
    const concurrentResults = await Promise.all(concurrentPromises);
    const successfulConcurrent = concurrentResults.filter(result => result.success);
    const failedConcurrent = concurrentResults.filter(result => !result.success);
    
    console.log(`✅ Concurrent success: ${successfulConcurrent.length}`);
    console.log(`❌ Concurrent failures: ${failedConcurrent.length}`);
    
    if (successfulConcurrent.length > 0) {
      console.log('\n📋 Concurrent tickets:');
      successfulConcurrent.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.ticket.ticket_number} - ${result.ticket.title}`);
      });
      
      // Check concurrent uniqueness
      const concurrentNumbers = successfulConcurrent.map(r => r.ticket.ticket_number);
      const uniqueConcurrent = [...new Set(concurrentNumbers)];
      
      if (concurrentNumbers.length === uniqueConcurrent.length) {
        console.log('✅ All concurrent ticket numbers are unique!');
      } else {
        console.log('❌ Duplicate numbers found in concurrent creation!');
      }
    }
    
    if (failedConcurrent.length > 0) {
      console.log('\n❌ Concurrent failures:');
      failedConcurrent.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.error}`);
      });
    }
    
    console.log('\n🎯 Final Status:');
    if (errors.length === 0 && failedConcurrent.length === 0) {
      console.log('✅ ALL TESTS PASSED - Duplicate ticket number issue is FIXED!');
    } else {
      console.log('⚠️  Some tests failed - Issue may still exist');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testTicketCreationFinal()
    .then(() => {
      console.log('\n🎉 Test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTicketCreationFinal };
