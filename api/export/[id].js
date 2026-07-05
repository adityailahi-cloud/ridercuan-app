const { sql, withApi } = require('../../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const id = req.query.id;
  const { rows: userRows } = await sql`SELECT * FROM users WHERE id=${id}`;
  const user = userRows[0];
  if (!user)       return res.status(404).json({ error: 'User tidak ditemukan' });
  if (!user.is_pro) return res.status(403).json({ error: 'Fitur hanya untuk PRO' });

  const { rows: txs } = await sql`SELECT * FROM transactions WHERE user_id=${id} ORDER BY "timestamp" DESC`;
  let csv = 'ID,Tipe,Jumlah,Catatan,Waktu\n';
  for (const tx of txs) csv += `${tx.id},${tx.type},${tx.amount},"${tx.note||''}",${tx.timestamp}\n`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ridercuan_${id}.csv"`);
  res.send(csv);
});
