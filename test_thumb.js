const fs = require('fs');
const https = require('https');
const token = '8846538187:AAFEp639xOsFH6zXHoocOJeAzxzDET3cLZg';
https.get(`https://api.telegram.org/bot${token}/getUpdates?offset=-5`, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log(data.slice(0, 500));
  });
}).on('error', e => console.error(e));
