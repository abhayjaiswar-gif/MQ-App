const fetch = require('node-fetch');

async function testSubmitTicket() {
  const payload = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Assistance with Grade 4 curriculum setup',
    message: 'This is a test message to verify the support ticketing system.'
  };

  try {
    const res = await fetch('http://localhost:3000/api/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Ticket submitted successfully!');
    } else {
      console.log('❌ Submission failed:', data.message);
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testSubmitTicket();
