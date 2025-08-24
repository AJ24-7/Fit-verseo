const { default: fetch } = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/gyms/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'fitverse.info@gmail.com',
        password: 'FitVerse@123'
      })
    });

    const result = await response.json();
    console.log('Login response:', JSON.stringify(result, null, 2));
    
    if (result.requires2FA) {
      console.log('❌ 2FA is still required - SecuritySettings not working');
    } else if (result.success) {
      console.log('✅ Login successful without 2FA - SecuritySettings working correctly!');
    } else {
      console.log('❌ Login failed:', result.message);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();
