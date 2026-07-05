/**
 * RiderCuan — DB helper (Vercel Postgres)
 * Dipakai bersama oleh semua serverless function di /api.
 */
const { neon } = require('@neondatabase/serverless');
const crypto    = require('crypto');

// DATABASE_URL diinject otomatis oleh Vercel setelah integrasi Neon Postgres
// dipasang lewat tab "Storage" pada dashboard project.
// fullResults:true membuat setiap query mengembalikan bentuk { rows, rowCount }
// (mirip driver 'pg'), supaya konsisten dipakai di semua endpoint di bawah.
const sql = neon(process.env.DATABASE_URL, { fullResults: true });

let schemaReady = null;

async function ensureSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL DEFAULT 'demo123',
        motor_brand TEXT DEFAULT 'Yamaha',
        motor_year INTEGER DEFAULT 2020,
        current_odometer REAL DEFAULT 0,
        ref_code TEXT UNIQUE NOT NULL,
        is_pro INTEGER DEFAULT 0,
        celengan_balance REAL DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        inviter_id INTEGER NOT NULL REFERENCES users(id),
        invited_code TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Seed demo user (id=1) kalau belum ada
    const existing = await sql`SELECT id FROM users WHERE id = 1`;
    if (existing.rowCount === 0) {
      const refCode = 'RIDER' + crypto.randomBytes(3).toString('hex').toUpperCase();
      await sql`
        INSERT INTO users (id, name, password, motor_brand, motor_year, current_odometer, ref_code, is_pro, celengan_balance)
        VALUES (1, 'Budi Santoso', 'demo123', 'Yamaha Mio M3', 2019, 14850, ${refCode}, 0, 18200)
      `;
      // Pastikan sequence id users tidak konflik dengan id=1 yang di-hardcode
      await sql`SELECT setval(pg_get_serial_sequence('users','id'), (SELECT MAX(id) FROM users))`;

      await sql`INSERT INTO transactions (user_id,type,amount,note,"timestamp")
                 VALUES (1,'argo',85000,'Pagi — Senen ke Blok M', NOW())`;
      await sql`INSERT INTO transactions (user_id,type,amount,note,"timestamp")
                 VALUES (1,'argo',62000,'Siang — Mampang ke Kuningan', NOW())`;
      await sql`INSERT INTO transactions (user_id,type,amount,note,"timestamp")
                 VALUES (1,'bensin',25000,'Isi bensin Pertamina', NOW())`;
      await sql`INSERT INTO transactions (user_id,type,amount,note,"timestamp")
                 VALUES (1,'parkir',2000,'Parkir warung makan', NOW())`;
      await sql`INSERT INTO transactions (user_id,type,amount,note,"timestamp")
                 VALUES (1,'makan',15000,'Nasi warteg siang', NOW())`;
    }
  })();

  return schemaReady;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Bungkus handler: pasang CORS, urus preflight, jamin schema siap, & tangkap error.
function withApi(handler) {
  return async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    try {
      await ensureSchema();
      await handler(req, res);
    } catch (err) {
      console.error('[api error]', err);
      res.status(500).json({ error: 'Kesalahan server.', detail: err.message });
    }
  };
}

module.exports = { sql, ensureSchema, withApi };
