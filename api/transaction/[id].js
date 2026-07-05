const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const id = req.query.id;
  const { rows } = await sql`SELECT * FROM transactions WHERE id = ${id}`;
  if (!rows[0]) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  await sql`DELETE FROM transactions WHERE id = ${id}`;
  res.json({ success: true, deleted_id: id });
});
