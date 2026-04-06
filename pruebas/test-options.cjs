const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/gas/macros/s/AKfycby2xpSsLyJ9PUoH_XX_j7UtHxeUdOB-Ouy97rib9wjri72BqlBj7L87jR3ArvlhkF1B/exec',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('body:', data.substring(0, 200));
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();
