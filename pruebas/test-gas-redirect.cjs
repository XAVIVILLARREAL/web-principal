const https = require('https');

const options = {
  hostname: 'script.googleusercontent.com',
  path: '/macros/echo?user_content_key=AWDtjMUjalaWUgmRkX0VxXyu_D5dMe_zwD5X0M3gKJigDJ7OVlJMnA6zkotxhvL9fW0zYbbx55EAf27P7AfizMAuK5eQN_pGeXSqWR_K0GcKymFQZD6mSSJdfU_qQXEIOwmiBTg_TaEa-1GaW5gWhpwb721R_GDhjwtnqvaevVAQ-Z7j0vh7FzkeWos3zxUgfZZ5F1Pc3KYITAoWyEdurnyvj2V1gQlfGP_5-h6icejW6AZreprciAGnUdjm77AJObvqZbLA4QoiGwNeE-Z6ExBkUYfTamS8Vw&lib=MFQBeygyAcn4hYrGxzcw84NzQpdRKMywe',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  }
};

const req = https.request(options, (res) => {
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
