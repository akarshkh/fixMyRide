const { execSync } = require('child_process');
const https = require('https');

// Test backend health
function testBackend(url, name) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing ${name} backend: ${url}`);
    
    https.get(url, (res) => {
      console.log(`📊 ${name} Status: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${name} is working!`);
          try {
            const response = JSON.parse(data);
            console.log(`📝 Response:`, response);
          } catch (e) {
            console.log(`📝 Response: ${data.substring(0, 100)}...`);
          }
          resolve({ status: 'success', url, name });
        } else {
          console.log(`❌ ${name} failed with status ${res.statusCode}`);
          resolve({ status: 'failed', url, name, statusCode: res.statusCode });
        }
      });
    }).on('error', err => {
      console.log(`❌ ${name} Error:`, err.message);
      resolve({ status: 'error', url, name, error: err.message });
    });
  });
}

async function main() {
  console.log('🚀 Backend Deployment Health Check\n');
  
  const backends = [
    { url: 'https://fixmyride-crm.onrender.com/api/health', name: 'Render' }
  ];
  
  const results = await Promise.all(
    backends.map(backend => testBackend(backend.url, backend.name))
  );
  
  console.log('\n📊 DEPLOYMENT SUMMARY:');
  console.log('========================');
  
  const workingBackends = results.filter(r => r.status === 'success');
  const failedBackends = results.filter(r => r.status !== 'success');
  
  if (workingBackends.length > 0) {
    console.log('\n✅ WORKING BACKENDS:');
    workingBackends.forEach(backend => {
      console.log(`   ${backend.name}: ${backend.url}`);
    });
  }
  
  if (failedBackends.length > 0) {
    console.log('\n❌ FAILED BACKENDS:');
    failedBackends.forEach(backend => {
      console.log(`   ${backend.name}: ${backend.url} (${backend.statusCode || backend.error})`);
    });
  }
  
  // Recommendations
  console.log('\n🔧 RECOMMENDATIONS:');
  if (workingBackends.length === 0) {
    console.log('   1. Both backends are down - need immediate action');
    console.log('   2. Check Render service logs');
    console.log('   3. Remove Vercel authentication if using Vercel');
    console.log('   4. Verify environment variables');
  } else {
    const workingBackend = workingBackends[0];
    console.log(`   1. Use ${workingBackend.name} as primary backend`);
    console.log(`   2. Update frontend .env.local to: NEXT_PUBLIC_API_URL=${workingBackend.url.replace('/api/health', '')}`);
  }
}

main().catch(console.error);
