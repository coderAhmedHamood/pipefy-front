const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNjU3MzQwLCJleHAiOjE3NjA3NDM3NDB9.tDU059FR8E2pQvOk2pWT8jsOKVEvArsPkDOwjyn6v0w';
const userId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testEndpoint() {
  try {
    const response = await fetch(`http://localhost:3004/api/reports/user/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('=== BASIC STATS ===');
      console.log('Total Tickets:', data.data.basic_stats.total_tickets);
      console.log('Active Tickets:', data.data.basic_stats.active_tickets);
      console.log('Completed Tickets:', data.data.basic_stats.completed_tickets);
      
      console.log('\n=== PERFORMANCE METRICS ===');
      if (data.data.performance_metrics) {
        console.log('Net Performance Hours:', data.data.performance_metrics.net_performance_hours);
      } else {
        console.log('NO PERFORMANCE METRICS');
      }
      
      console.log('\n=== COMPLETED TICKETS DETAILS ===');
      if (data.data.completed_tickets_details) {
        console.log('Count:', data.data.completed_tickets_details.length);
        console.log('\nFirst 5 tickets:');
        data.data.completed_tickets_details.slice(0, 5).forEach((ticket, index) => {
          console.log(`${index + 1}. ${ticket.ticket_number}`);
          console.log(`   Variance: ${ticket.variance_hours} hours`);
          console.log(`   Status: ${ticket.performance_status}`);
        });
      } else {
        console.log('NO COMPLETED TICKETS DETAILS');
      }
    } else {
      console.log('ERROR:', data);
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

testEndpoint();
