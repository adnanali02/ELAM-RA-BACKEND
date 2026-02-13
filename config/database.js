const { Pool } = require('pg');
require('dotenv').config();

// تنظيف الرابط من أي علامات تنصيص قد تكون بقيت
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/['"]/g, "") : "";

console.log("Attempting to connect to DB..."); // سنرى هذه الرسالة في السجلات

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // هذا السطر هو مفتاح الحل مع Neon
    },
    connectionTimeoutMillis: 5000 // مهلة 5 ثواني
});

pool.on('connect', () => {
    console.log('✅ Connected to Database successfully!');
});

pool.on('error', (err) => {
    console.error('❌ Database Error:', err);
});

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    initialize: async () => {
        try {
            await pool.query('SELECT NOW()');
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};
