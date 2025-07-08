const https = require('https');

const API_BASE_URL = 'https://fix-my-ride-b78em6of7-khandelwalakarshak-5961s-projects.vercel.app';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 Testing Fix My Ride Backend API...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResult = await makeRequest('/api/health');
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Response:`, healthResult.data);
    console.log('');
    
    // Test auth endpoint with sample data
    console.log('2. Testing auth endpoint...');
    const authResult = await makeRequest('/api/auth', 'POST', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`   Status: ${authResult.status}`);
    console.log(`   Response:`, authResult.data);
    console.log('');
    
    console.log('✅ API testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();
