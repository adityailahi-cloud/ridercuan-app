const { sql, withApi } = require('../_lib/db');

const KM_COST_PER_KM = 32.5;

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { user_id, new_odometer } = req.body || {};
  if (!user_id || !new_odometer) return res.status(400).json({ error: 'Data tidak lengkap' });

  const { rows } = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const selisihKM = new_odometer - user.current_odometer;
  if (selisihKM <= 0) return res.status(400).json({ error: 'Odometer baru harus lebih besar' });

  const potongan = Math.round(selisihKM * KM_COST_PER_KM);

  await sql`INSERT INTO transactions (user_id,type,amount,note)
            VALUES (${user_id}, 'celengan', ${potongan}, ${`Servis: ${selisihKM.toFixed(1)} km x Rp32,5`})`;
  await sql`UPDATE users SET current_odometer=${new_odometer}, celengan_balance=celengan_balance+${potongan} WHERE id=${user_id}`;

  const { rows: updatedRows } = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  res.json({ success: true, selisihKM: selisihKM.toFixed(1), potongan, celengan_balance: updatedRows[0].celengan_balance });
});
