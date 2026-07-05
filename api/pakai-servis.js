const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { user_id, amount } = req.body || {};
  if (!user_id || !amount || amount <= 0) return res.status(400).json({ error: 'Data tidak valid.' });

  const { rows } = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });
  if (user.celengan_balance < amount)
    return res.status(400).json({ error: `Saldo tidak cukup. Saldo: Rp${Math.round(user.celengan_balance).toLocaleString('id-ID')}` });

  await sql`UPDATE users SET celengan_balance=celengan_balance-${amount} WHERE id=${user_id}`;
  await sql`INSERT INTO transactions (user_id,type,amount,note)
            VALUES (${user_id}, 'pakai_celengan', ${amount}, 'Bayar servis motor dari celengan')`;

  const { rows: updatedRows } = await sql`SELECT * FROM users WHERE id = ${user_id}`;
  res.json({
    success: true,
    celengan_balance: updatedRows[0].celengan_balance,
    message: `Rp${Math.round(amount).toLocaleString('id-ID')} berhasil dipakai untuk servis.`,
  });
});
