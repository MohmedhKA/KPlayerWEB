const fs = require('fs');
const path = require('path');

const certPath = path.join(__dirname, '../../certficate/cert.pem');
const keyPath = path.join(__dirname, '../../certficate/key.pem');

const httpsConfig = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

module.exports = httpsConfig;