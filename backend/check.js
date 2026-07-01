const bcrypt = require('bcryptjs');
const hash = '$2a$10$lt/EGUIXroMiD5X.LQ/fUuyd1lUzN/kXhIuGjw.vxIyTrfoRdLOVm';
const passwords = ['admin', 'admin123', 'password', 'password123', 'kaliforlife', '123456', '12345678', 'mrphotographer', 'snapnear_secret_key_123', '123'];

let found = false;
for (const p of passwords) {
  if (bcrypt.compareSync(p, hash)) {
    console.log('FOUND:', p);
    found = true;
    break;
  }
}
if (!found) console.log('Not found in common list');
