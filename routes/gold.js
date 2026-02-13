/**
 * =====================================================
 * مسارات الذهب
 * Gold Routes
 * =====================================================
 * الملف: backend/routes/gold.js
 * الغرض: تعريف مسارات أسعار الذهب
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const GoldController = require('../controllers/goldController');
const { 
    validateSession, 
    requireRole, 
    csrfProtection,
    rateLimiter 
} = require('../middleware/security');

// =====================================================
// مسارات عامة (لا تتطلب تسجيل دخول)
// Public Routes
// =====================================================

/**
 * @route   GET /api/gold/prices
 * @desc    جلب جميع أسعار الذهب الحالية
 * @access  Public
 */
router.get('/prices', GoldController.getAllPrices);

/**
 * @route   GET /api/gold/types
 * @desc    جلب جميع أنواع الذهب
 * @access  Public
 */
router.get('/types', GoldController.getGoldTypes);

/**
 * @route   GET /api/gold/prices/:id
 * @desc    جلب سعر الذهب حسب المعرف
 * @access  Public
 */
router.get('/prices/:id', GoldController.getPriceById);

/**
 * @route   GET /api/gold/current/:goldTypeId
 * @desc    جلب السعر الحالي لنوع ذهب معين
 * @access  Public
 */
router.get('/current/:goldTypeId', GoldController.getCurrentPrice);

/**
 * @route   GET /api/gold/history/:goldTypeId
 * @desc    جلب تاريخ أسعار الذهب
 * @access  Public
 */
router.get('/history/:goldTypeId', GoldController.getPriceHistory);

/**
 * @route   GET /api/gold/compare
 * @desc    مقارنة أسعار الذهب
 * @access  Public
 */
router.get('/compare', GoldController.comparePrices);

/**
 * @route   GET /api/gold/statistics/:goldTypeId
 * @desc    جلب إحصائيات أسعار الذهب
 * @access  Public
 */
router.get('/statistics/:goldTypeId', GoldController.getStatistics);

// =====================================================
// مسارات محمية (تتطلب تسجيل دخول)
// Protected Routes
// =====================================================

/**
 * @route   POST /api/gold/prices
 * @desc    إنشاء سعر ذهب جديد
 * @access  Private (Manager, Admin)
 */
router.post('/prices', 
    validateSession,
    requireRole(['admin', 'manager']),
    csrfProtection,
    GoldController.createPrice
);

/**
 * @route   PUT /api/gold/prices/:id
 * @desc    تحديث سعر ذهب
 * @access  Private (Manager, Admin)
 */
router.put('/prices/:id', 
    validateSession,
    requireRole(['admin', 'manager']),
    csrfProtection,
    GoldController.updatePrice
);

/**
 * @route   DELETE /api/gold/prices/:id
 * @desc    حذف سعر ذهب
 * @access  Private (Admin only)
 */
router.delete('/prices/:id', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    GoldController.deletePrice
);

/**
 * @route   POST /api/gold/auto-update
 * @desc    تحديث الأسعار تلقائياً
 * @access  Private (Admin only)
 */
router.post('/auto-update', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    rateLimiter({ maxRequests: 10 }),
    GoldController.autoUpdatePrices
);

// =====================================================
// تصدير المسار
// Export router
// =====================================================
module.exports = router;