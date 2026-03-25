// Using built-in fetch (Node 18+)

async function testParentsReports() {
  try {
    const response = await fetch('http://localhost:3000/api/parents-reports');
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    if (data.success && Array.isArray(data.reports)) {
      console.log('✅ Success: API returned reports array.');
    } else {
      console.log('❌ Failure: API response format incorrect.');
    }
  } catch (err) {
    console.error('❌ Error calling API:', err.message);
  }
}

testParentsReports();
