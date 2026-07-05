const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { user_id, invited_code } = req.body || {};
  if (!user_id || !invited_code) return res.status(400).json({ error: 'Data tidak lengkap' });

  const { rows: userRows } = await sql`SELECT * FROM users WHERE id=${user_id}`;
  const user = userRows[0];
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  if (invited_code === user.ref_code) return res.status(400).json({ error: 'Tidak bisa pakai kode sendiri' });

  const { rows: alreadyRows } = await sql`SELECT id FROM referrals WHERE inviter_id=${user_id} AND invited_code=${invited_code}`;
  if (alreadyRows[0]) return res.status(400).json({ error: 'Kode ini sudah pernah dimasukkan' });

  await sql`INSERT INTO referrals (inviter_id,invited_code,status) VALUES (${user_id}, ${invited_code}, 'pending')`;
  const { rows: countRows } = await sql`SELECT COUNT(*)::int as c FROM referrals WHERE inviter_id=${user_id}`;
  const count  = countRows[0].c;
  const reward = count >= 5 ? '🎉 Selamat! Kamu dapat e-Voucher Pertamina Rp10.000!' : `${count}/5 teman berhasil diajak`;

  res.json({ success: true, count, reward });
});
