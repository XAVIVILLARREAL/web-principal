const https = require('https');

const options = {
  hostname: 'script.google.com',
  path: '/macros/s/AKfycby2xpSsLyJ9PUoH_XX_j7UtHxeUdOB-Ouy97rib9wjri72BqlBj7L87jR3ArvlhkF1B/exec',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  }
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
});

req.write(JSON.stringify({ action: 'getApps', username: 'test' }));
req.end();
