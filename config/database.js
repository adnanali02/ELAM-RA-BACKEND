/**
 * =====================================================
 * إعدادات قاعدة البيانات (المحدثة والمؤمنة)
 * Database Configuration
 * =====================================================
 * الملف: backend/config/database.js
 * الغرض: إدارة الاتصال بقاعدة البيانات PostgreSQL (Render + Neon)
 * =====================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// =====================================================
// إعداد الاتصال والمعالجة الذكية
// Connection Setup & Sanitization
// =====================================================

let connectionString = process.env.DATABASE_URL;

// 🛡️ حماية إضافية: تنظيف الرابط من علامات التنصيص إذا وجدت بالخطأ
if (connectionString) {
    connectionString = connectionString.replace(/^['"]|['"]$/g, '').trim();
}

if (!connectionString) {
    console.error('❌ CRITICAL ERROR: DATABASE_URL is missing in environment variables!');
}

const poolConfig = {
    connectionString: connectionString,
    // 🔒 إعدادات SSL: ضرورية لـ Render و Neon
    // rejectUnauthorized: false يضمن التشفير (Encryption) لكنه يسمح بشهادات Neon الذاتية
    ssl: {
        rejectUnauthorized: false 
    },
    max: 20, // الحد الأقصى للاتصالات
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // زيادة المهلة قليلاً لتجنب الفصل السريع
};

// =====================================================
// فئة إدارة قاعدة البيانات
// Database Manager Class
// =====================================================
class DatabaseManager {
    constructor() {
        // إنشاء مسبح الاتصالات
        this.pool = new Pool(poolConfig);
        
        // التعامل مع أخطاء الاتصال المفاجئة لمنع توقف السيرفر
        this.pool.on('error', (err, client) => {
            console.error('⚠️ Unexpected error on idle client:', err);
            // لا نغلق العملية (process.exit) للحفاظ على استمرار السيرفر
        });
    }

    /**
     * اختبار الاتصال (Health Check)
     */
    async testConnection() {
        try {
            const client = await this.pool.connect();
            // استعلام بسيط للتأكد من أن قاعدة البيانات ترد فعلياً
            await client.query('SELECT NOW()'); 
            console.log('✅ Successfully connected to PostgreSQL database (Secure SSL)');
            client.release();
            return true;
        } catch (err) {
            console.error('❌ Database connection error:', err.message);
            return false;
        }
    }

    /**
     * تنفيذ استعلام عام
     */
    async query(text, params) {
        return this.pool.query(text, params);
    }

    /**
     * جلب صف واحد
     * (مطابق للكود القديم)
     */
    async get(sql, params = []) {
        try {
            const res = await this.pool.query(sql, params);
            return res.rows[0];
        } catch (err) {
            console.error('SQL Error (get):', err.message);
            throw err;
        }
    }

    /**
     * جلب جميع الصفوف
     * (مطابق للكود القديم)
     */
    async all(sql, params = []) {
        try {
            const res = await this.pool.query(sql, params);
            return res.rows;
        } catch (err) {
            console.error('SQL Error (all):', err.message);
            throw err;
        }
    }

    /**
     * تنفيذ أمر (إدخال/تعديل/حذف)
     * (مطابق للكود القديم مع تحسين دعم PostgreSQL)
     */
    async run(sql, params = []) {
        try {
            const res = await this.pool.query(sql, params);
            return {
                // ملاحظة: لكي يعمل id يجب أن تحتوي جملة SQL على "RETURNING id"
                id: res.rows[0]?.id || null, 
                changes: res.rowCount
            };
        } catch (err) {
            console.error('SQL Error (run):', err.message);
            throw err;
        }
    }

    /**
     * تهيئة الجداول
     */
    async initialize() {
        try {
            const schemaPath = path.join(__dirname, '../../database/schema.sql');
            
            if (fs.existsSync(schemaPath)) {
                console.log('📂 Loading schema from:', schemaPath);
                const schema = fs.readFileSync(schemaPath, 'utf8');
                
                // تنفيذ السكيما
                await this.pool.query(schema);
                console.log('✅ Database schema initialized successfully');
                
                // إجراء فحص اتصال نهائي
                return await this.testConnection();
            } else {
                console.warn('⚠️ Schema file not found at:', schemaPath);
                return true; 
            }
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            return false;
        }
    }

    /**
     * إغلاق الاتصال
     */
    async end() {
        await this.pool.end();
        console.log('Database pool closed.');
    }
}

// تصدير نسخة واحدة (Singleton)
const dbManager = new DatabaseManager();

module.exports = dbManager;
