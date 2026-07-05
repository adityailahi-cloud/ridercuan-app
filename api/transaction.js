const { sql, withApi } = require('../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const { user_id, type, amount, note } = req.body || {};
  if (!user_id || !type || !amount) return res.status(400).json({ error: 'Data tidak lengkap' });

  const valid = ['argo','bensin','parkir','makan','affiliate_buy'];
  if (!valid.includes(type)) return res.status(400).json({ error: 'Tipe tidak valid' });

  const { rows } = await sql`
    INSERT INTO transactions (user_id, type, amount, note)
    VALUES (${user_id}, ${type}, ${amount}, ${note || ''})
    RETURNING *
  `;
  res.json({ success: true, transaction: rows[0] });
});
