import https from 'https';

https.get('https://ais-dev-fnqttxa5svraju6qxiab4v-194161721171.us-east1.run.app/api/db/cotizaciones?limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoid2ViX2Fub24iLCJleHAiOjE3NzgwMjYyNTJ9.EuQKKgTEB6qepV3ojfaMbIAxled7Qq-w2n-ph0XTR3A'
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
});
