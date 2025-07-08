const https = require('https');

function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Client'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📊 ${method} ${url}`);
      console.log(`   Status: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          console.log(`   ✅ Response:`, parsed);
        } catch (e) {
          console.log(`   📝 Response (raw):`, responseData.substring(0, 200));
        }
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Error testing ${url}:`, err.message);
      resolve({ error: err.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing Working Render Backend\n');
  
  // Test root endpoint
  console.log('1. Testing root endpoint...');
  await testEndpoint('https://fixmyride-crm.onrender.com/');
  
  console.log('\n2. Testing health endpoint...');
  await testEndpoint('https://fixmyride-crm.onrender.com/api/health');
  
  console.log('\n3. Testing auth endpoint...');
  await testEndpoint('https://fixmyride-crm.onrender.com/api/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  
  console.log('\n🎉 All tests completed!');
}

main().catch(console.error);
