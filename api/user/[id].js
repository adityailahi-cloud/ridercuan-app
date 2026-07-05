const { sql, withApi } = require('../../_lib/db');

module.exports = withApi(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method tidak diizinkan' });

  const id = req.query.id;
  const { rows: userRows } = await sql`SELECT * FROM users WHERE id = ${id}`;
  const user = userRows[0];
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const { rows: txs } = await sql`
    SELECT * FROM transactions
    WHERE user_id = ${id}
      AND ("timestamp" AT TIME ZONE 'Asia/Jakarta')::date = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
    ORDER BY "timestamp" DESC
  `;

  let totalArgo=0, totalBensin=0, totalParkir=0, totalMakan=0, totalCelenganHariIni=0, totalPakaiCelengan=0;
  for (const tx of txs) {
    const amount = Number(tx.amount);
    if (tx.type === 'argo')           totalArgo            += amount;
    if (tx.type === 'bensin')         totalBensin          += amount;
    if (tx.type === 'parkir')         totalParkir          += amount;
    if (tx.type === 'makan')          totalMakan           += amount;
    if (tx.type === 'celengan')       totalCelenganHariIni += amount;
    if (tx.type === 'pakai_celengan') totalPakaiCelengan   += amount;
  }

  const totalOperasional = totalBensin + totalParkir + totalMakan + totalPakaiCelengan;
  const operasionalBesok = Math.round(totalOperasional * 0.20);
  const uangBersihDapur  = totalArgo - totalOperasional - totalCelenganHariIni - operasionalBesok;

  const { rows: refRows } = await sql`SELECT COUNT(*)::int as c FROM referrals WHERE inviter_id = ${id}`;

  res.json({
    user,
    dashboard: { totalArgo, totalBensin, totalParkir, totalMakan, totalOperasional,
                 celenganHariIni: totalCelenganHariIni, operasionalBesok, uangBersihDapur },
    transactions: txs,
    referralCount: refRows[0].c,
  });
});
