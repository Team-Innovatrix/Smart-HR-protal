const fetch = require('node-fetch'); // Using built-in fetch if node >= 18

async function testWebhook() {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbwkEOKl2LLscH-cRxXWk21EcZS_KsA-hyrG9xsOutLpbnjNBFqzJITh8qEGCQXc-1u1hg/exec', {
      method: 'POST',
      body: JSON.stringify({
        employeeName: 'Mohit Test',
        post: 'Engineer',
        action: 'clock-out',
        date: '14/05/26',
        time: '11:45 PM',
        location: 'Local Test'
      })
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

testWebhook();
