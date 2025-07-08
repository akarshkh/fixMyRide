const https = require('https');

// Test Render backend
console.log('Testing Render backend...');
https.get('https://fixmyride-backend.onrender.com', (res) => {
  console.log('Render Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.length > 200) {
      console.log('Render Response:', data.substring(0, 200) + '...');
    } else {
      console.log('Render Response:', data);
    }
    
    // Test Vercel backend after Render
    testVercel();
  });
}).on('error', err => {
  console.log('Render Error:', err.message);
  testVercel();
});

function testVercel() {
  console.log('\nTesting Vercel backend...');
  https.get('https://fix-my-ride-b78em6of7-khandelwalakarshak-5961s-projects.vercel.app/api/health', (res) => {
    console.log('Vercel Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (data.length > 200) {
        console.log('Vercel Response:', data.substring(0, 200) + '...');
      } else {
        console.log('Vercel Response:', data);
      }
    });
  }).on('error', err => {
    console.log('Vercel Error:', err.message);
  });
}
