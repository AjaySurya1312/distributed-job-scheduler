const http = require('http');

const data = JSON.stringify({
  firstName: 'New',
  lastName: 'Person',
  organizationName: 'New Org',
  email: 'newperson@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 80,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', chunk => responseData += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${responseData}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
