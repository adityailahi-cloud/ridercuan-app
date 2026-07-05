const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { name, password } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Nama tidak boleh kosong.' });
  if (!password)     return res.status(400).json({ error: 'Password tidak boleh kosong.' });

  const { rows } = await sql`SELECT * FROM users WHERE LOWER(name) = LOWER(${name.trim()})`;
  const user = rows[0];
  if (!user)                        return res.status(404).json({ error: 'Akun tidak ditemukan, silakan daftar dulu.' });
  if (user.password !== password)   return res.status(401).json({ error: 'Password salah, coba lagi.' });

  const { password: _pw, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});
