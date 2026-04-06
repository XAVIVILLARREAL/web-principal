import https from 'https';

https.get('https://api-datos.xtremediagnostics.com/cotizaciones?limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJleHAiOjE3NzgwMjYyNTJ9.EuQKKgTEB6qepV3ojfaMbIAxled7Qq-w2n-ph0XTR3A'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(data.substring(0, 200)); });
});
