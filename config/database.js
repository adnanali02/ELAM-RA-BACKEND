/**
 * =====================================================
 * إعدادات قاعدة البيانات
 * Database Configuration
 * =====================================================
 * الملف: backend/config/database.js
 * الغرض: إدارة الاتصال بقاعدة البيانات PostgreSQL (Render)
 * =====================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// =====================================================
// إعداد الاتصال
// Connection Setup
// =====================================================
// نستخدم رابط قاعدة البيانات من متغيرات البيئة في Render
// في حال العمل محلياً، يمكنك وضع الرابط في ملف .env
const connectionString = process.env.DATABASE_URL;

const poolConfig = {
    connectionString: connectionString,
    // إعدادات SSL ضرورية للعمل على Render
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // الحد الأقصى للاتصالات المتزامنة
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// =====================================================
// فئة إدارة قاعدة البيانات
// Database Manager Class
// =====================================================
class DatabaseManager {
    constructor() {
        // إنشاء مسبح الاتصالات (Connection Pool)
        this.pool = new Pool(poolConfig);
        
        // التعامل مع أخطاء الاتصال غير المتوقعة
        this.pool.on('error', (err, client) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    /**
     * اختبار الاتصال
     * Test Connection
     */
    async testConnection() {
        try {
            const client = await this.pool.connect();
            console.log('Successfully connected to PostgreSQL database');
            client.release();
            return true;
        } catch (err) {
            console.error('Database connection error:', err.message);
            return false;
        }
    }

    /**
     * تنفيذ استعلام عام (متوافق مع pg)
     * Execute generic query
     */
    async query(text, params) {
        return this.pool.query(text, params);
    }

    /**
     * جلب صف واحد (للتوافق مع الكود القديم)
     * Get single row
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
     * جلب جميع الصفوف (للتوافق مع الكود القديم)
     * Get all rows
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
     * Execute command (Insert/Update/Delete)
     * ملاحظة: في PostgreSQL لا يوجد this.lastID تلقائياً
     * يجب استخدام "RETURNING id" في جملة SQL للحصول على المعرف
     */
    async run(sql, params = []) {
        try {
            const res = await this.pool.query(sql, params);
            // محاولة محاكاة استجابة SQLite للحفاظ على توافق الكود
            return {
                id: res.rows[0]?.id || null, // يعمل فقط إذا استخدمت RETURNING id
                changes: res.rowCount
            };
        } catch (err) {
            console.error('SQL Error (run):', err.message);
            throw err;
        }
    }

    /**
     * تهيئة الجداول (تستخدم عند بدء التشغيل)
     * Initialize Tables
     */
    async initialize() {
        try {
            // قراءة ملف المخطط (Schema)
            // تنبيه: تأكد أن ملف schema.sql يستخدم صيغة PostgreSQL وليست SQLite
            const schemaPath = path.join(__dirname, '../../database/schema.sql');
            
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await this.pool.query(schema);
                console.log('Database schema initialized successfully');
            }
            
            return true;
        } catch (error) {
            console.error('Database initialization error:', error);
            // لا نوقف البرنامج، فقد تكون الجداول موجودة مسبقاً
            return false;
        }
    }

    /**
     * إغلاق الاتصال نهائياً
     * End Pool
     */
    async end() {
        await this.pool.end();
    }
}

// تصدير نسخة واحدة (Singleton)
const dbManager = new DatabaseManager();

module.exports = dbManager;