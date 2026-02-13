/**
 * =====================================================
 * خادم التطبيق الرئيسي (Render Version)
 * Main Application Server
 * =====================================================
 * الملف: backend/server.js
 * الغرض: خادم API فقط (مفصول عن الواجهة)
 * =====================================================
 */

// =====================================================
// استيراد المكتبات
// =====================================================
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const pgSession = require('connect-pg-simple')(session); // استبدال SQLite بـ PostgreSQL
require('dotenv').config();

// =====================================================
// استيراد الإعدادات
// =====================================================
// ملاحظة: تأكد من وجود ملف config/security.js أو حذف هذا السطر إذا لم يعد مستخدماً
// const { SECURITY_CONFIG } = require('./config/security'); 
const db = require('./config/database');

// =====================================================
// استيراد المسارات (API Routes)
// =====================================================
const authRoutes = require('./routes/auth');
const goldRoutes = require('./routes/gold');
const currencyRoutes = require('./routes/currency');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

// =====================================================
// إعداد التطبيق
// =====================================================
const app = express();
const PORT = process.env.PORT || 10000; // Render يستخدم عادة المنفذ 10000
const NODE_ENV = process.env.NODE_ENV || 'production';

// =====================================================
// إعدادات الأمان والـ Middleware
// =====================================================

app.use(helmet()); // تفعيل حماية Helmet الأساسية

// إعداد CORS (هام جداً للربط مع GitHub)
app.use(cors({
    origin: [
        'http://localhost:5500', // للتجربة المحلية
        'http://127.0.0.1:5500', // للتجربة المحلية
        'https:https://adnanali02.github.io' // ⚠️ استبدل هذا برابط موقعك على GitHub
    ],
    credentials: true, // للسماح بمرور ملفات تعريف الارتباط (Cookies)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =====================================================
// إعداد الجلسات (Sessions) مع PostgreSQL
// =====================================================
app.use(session({
    store: new pgSession({
        pool: db.pool,                // استخدام اتصال قاعدة البيانات من ملف database.js
        tableName: 'session',         // اسم الجدول في قاعدة البيانات
        createTableIfMissing: true    // إنشاء الجدول تلقائياً إذا لم يكن موجوداً
    }),
    secret: process.env.SESSION_SECRET || 'super-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
        secure: NODE_ENV === 'production', // يجب أن يكون true عند الرفع ليعمل مع HTTPS
        httpOnly: true,
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax', // 'none' ضروري للربط بين نطاقين مختلفين (GitHub & Render)
        maxAge: 24 * 60 * 60 * 1000 // 24 ساعة
    }
}));

// =====================================================
// المسارات (Routes)
// =====================================================

// فحص حالة الخادم وقاعدة البيانات الحقيقية
app.get('/api/health', async (req, res) => {
    try {
        // محاولة تنفيذ استعلام بسيط للتأكد من الاتصال
        await db.query('SELECT 1');
        res.status(200).json({ 
            status: 'active', 
            dbState: 'connected' // ✅ سيظهر هذا إذا نجح الاستعلام
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'active', 
            dbState: 'disconnected',
            error: error.message 
        });
    }
});

// ربط مسارات الـ API
app.use('/api/auth', authRoutes);
app.use('/api/gold', goldRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// التعامل مع الصفحات غير الموجودة (404)
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// معالج الأخطاء العام
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// =====================================================
// تشغيل الخادم
// =====================================================
const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // محاولة تهيئة قاعدة البيانات عند التشغيل
    try {
        await db.initialize();
        console.log('Database initialized.');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
});
