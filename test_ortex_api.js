const ORTEX_API_KEY = 'Q0VpvWFI.wPuSEG6CNr7uoRZbtFcmVeeXpoJvjz75';

async function testOrtexAPI() {
  console.log('\n=== Testing Ortex API ===\n');
  
  try {
    // Test Ortex API - Short Interest endpoint
    console.log('Testing Ortex Short Interest for AAPL...');
    const url = `https://api.ortex.com/v1/short-interest/AAPL`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ORTEX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ortex API Success!');
      console.log('Sample data:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      const errorText = await response.text();
      console.log('❌ Ortex API Error:', errorText);
      
      // Try alternative endpoint
      console.log('\nTrying alternative endpoint format...');
      const altUrl = `https://public.ortex.com/v1/data/short-interest/AAPL`;
      const altResponse = await fetch(altUrl, {
        headers: {
          'api-key': ORTEX_API_KEY
        }
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log('✅ Alternative endpoint works!');
        console.log('Data:', JSON.stringify(altData, null, 2).substring(0, 500));
      } else {
        console.log('Alternative endpoint status:', altResponse.status);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testOrtexAPI();
