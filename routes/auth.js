/**
 * =====================================================
 * مسارات المصادقة
 * Authentication Routes
 * =====================================================
 * الملف: backend/routes/auth.js
 * الغرض: تعريف مسارات المصادقة
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { 
    csrfProtection, 
    bruteForceProtection,
    validateSession,
    rateLimiter 
} = require('../middleware/security');

// =====================================================
// مسارات المصادقة العامة
// Public Auth Routes
// =====================================================

/**
 * @route   POST /api/auth/csrf
 * @desc    الحصول على CSRF token
 * @access  Public
 */
router.get('/csrf', AuthController.getCSRFToken);

/**
 * @route   POST /api/auth/login
 * @desc    تسجيل الدخول
 * @access  Public
 */
router.post('/login', 
    rateLimiter({ 
        windowMs: 15 * 60 * 1000, // 15 دقيقة
        maxRequests: 5 
    }),
    bruteForceProtection(),
    AuthController.login
);

// =====================================================
// مسارات المصادقة المحمية
// Protected Auth Routes
// =====================================================

/**
 * @route   POST /api/auth/logout
 * @desc    تسجيل الخروج
 * @access  Private
 */
router.post('/logout', 
    validateSession,
    AuthController.logout
);

/**
 * @route   GET /api/auth/session
 * @desc    التحقق من الجلسة
 * @access  Private
 */
router.get('/session', 
    validateSession,
    AuthController.checkSession
);

/**
 * @route   POST /api/auth/change-password
 * @desc    تغيير كلمة المرور
 * @access  Private
 */
router.post('/change-password', 
    validateSession,
    csrfProtection,
    AuthController.changePassword
);

/**
 * @route   POST /api/auth/refresh
 * @desc    تجديد الجلسة
 * @access  Private
 */
router.post('/refresh', 
    validateSession,
    AuthController.refreshSession
);

// =====================================================
// تصدير المسار
// Export router
// =====================================================
module.exports = router;