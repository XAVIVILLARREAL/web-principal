const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/gas/macros/s/AKfycby2xpSsLyJ9PUoH_XX_j7UtHxeUdOB-Ouy97rib9wjri72BqlBj7L87jR3ArvlhkF1B/exec',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'http://localhost:3000',
    'Referer': 'http://localhost:3000/'
  }
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('body:', data.substring(0, 200));
  });
});

req.write(JSON.stringify({ action: 'getApps', username: 'test' }));
req.end();
