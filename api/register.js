const crypto = require('crypto');
const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { name, password, motor_brand, motor_year, current_odometer } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Nama tidak boleh kosong.' });
  if (!password)     return res.status(400).json({ error: 'Password tidak boleh kosong.' });

  const { rows: existingRows } = await sql`SELECT id FROM users WHERE LOWER(name) = LOWER(${name.trim()})`;
  if (existingRows[0]) return res.status(409).json({ error: 'Nama ini sudah terdaftar. Coba masuk saja.' });

  const refCode = 'RIDER' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const { rows } = await sql`
    INSERT INTO users (name, password, motor_brand, motor_year, current_odometer, ref_code, is_pro, celengan_balance)
    VALUES (${name.trim()}, ${password}, ${motor_brand || 'Yamaha Mio M3'}, ${motor_year || 2020}, ${current_odometer || 0}, ${refCode}, 0, 0)
    RETURNING *
  `;
  const { password: _pw, ...safeUser } = rows[0];
  res.json({ success: true, user: safeUser });
});
