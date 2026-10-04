const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const pub = path.join(__dirname, '..', 'public');

if (fs.existsSync(dist)) {
  fs.cpSync(dist, pub, { recursive: true, force: true });
}
