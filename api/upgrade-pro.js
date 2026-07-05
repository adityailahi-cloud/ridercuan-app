const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Data tidak lengkap' });

  await sql`UPDATE users SET is_pro=1 WHERE id=${user_id}`;
  res.json({ success: true, message: 'Akun berhasil di-upgrade ke PRO!' });
});
