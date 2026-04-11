const http = require('http');

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvSWQiOjksImVtcGxlYWRvSWQiOjksInVzZXJuYW1lIjoiZW1wbGVhZG8xIiwicm9sZXMiOlsiRW1wbGVhZG8iXSwiaWF0IjoxNzc1ODU1NTM1LCJleHAiOjE3NzU5NDE5MzV9.CYZgv4U6vu2FbKYm7VUETqy8jC9a0VChV_TZiGPkg1Y';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/attendance/today',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
