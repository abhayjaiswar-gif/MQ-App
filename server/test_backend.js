const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBackend() {
  try {
    const res = await fetch('http://localhost:3000/api/schools');
    const data = await res.json();
    console.log('Schools with student_count:', data.schools.slice(0, 2).map(s => ({ name: s.name, count: s.student_count })));
  } catch (e) {
    console.error('Backend test failed:', e.message);
  }
}

testBackend();
