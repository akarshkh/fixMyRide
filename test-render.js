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
      console.log(`   Headers:`, res.headers);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Response:`, parsed);
        } catch (e) {
          console.log(`   Response (raw):`, data.substring(0, 200));
        }
        resolve({ status: res.statusCode, data });
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
  console.log('🔍 Testing Render Backend Endpoints\n');
  
  // Test root endpoint
  await testEndpoint('https://fixmyride-backend.onrender.com/');
  
  console.log('\n');
  
  // Test health endpoint
  await testEndpoint('https://fixmyride-backend.onrender.com/api/health');
  
  console.log('\n');
  
  // Test auth endpoint
  await testEndpoint('https://fixmyride-backend.onrender.com/api/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
}

main().catch(console.error);
