import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/db/cotizaciones?limit=1',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJleHAiOjE3NzgwMjYyNTJ9.EuQKKgTEB6qepV3ojfaMbIAxled7Qq-w2n-ph0XTR3A'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk.substring(0, 200)}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
