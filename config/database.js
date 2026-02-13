const { Pool } = require('pg');
require('dotenv').config();

// إصلاح الرابط تلقائياً (إزالة علامات التنصيص إن وجدت)
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/['"]/g, "") : "";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // ⚠️ هذا السطر ضروري جداً لـ Neon
    },
    connectionTimeoutMillis: 5000 // مهلة 5 ثواني
});

// رسائل تظهر في السجلات لنعرف حالة الاتصال
pool.on('connect', () => {
    console.log('✅ Database Connected Successfully!');
});

pool.on('error', (err) => {
    console.error('❌ Database Connection Error:', err);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    initialize: async () => {
        try {
            await pool.query('SELECT NOW()'); // تجربة استعلام بسيط
            return true;
        } catch (e) {
            console.error('Initialization Error:', e);
            return false;
        }
    }
};
