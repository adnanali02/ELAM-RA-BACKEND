/**
 * =====================================================
 * مسارات العملات
 * Currency Routes
 * =====================================================
 * الملف: backend/routes/currency.js
 * الغرض: تعريف مسارات أسعار العملات
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const CurrencyController = require('../controllers/currencyController');
const { 
    validateSession, 
    requireRole, 
    csrfProtection 
} = require('../middleware/security');

// =====================================================
// مسارات عامة (لا تتطلب تسجيل دخول)
// Public Routes
// =====================================================

/**
 * @route   GET /api/currency/rates
 * @desc    جلب جميع أسعار العملات الحالية
 * @access  Public
 */
router.get('/rates', CurrencyController.getAllRates);

/**
 * @route   GET /api/currency/currencies
 * @desc    جلب جميع العملات
 * @access  Public
 */
router.get('/currencies', CurrencyController.getCurrencies);

/**
 * @route   GET /api/currency/rates/:id
 * @desc    جلب سعر العملة حسب المعرف
 * @access  Public
 */
router.get('/rates/:id', CurrencyController.getRateById);

/**
 * @route   GET /api/currency/current/:currencyId
 * @desc    جلب السعر الحالي لعملة معينة
 * @access  Public
 */
router.get('/current/:currencyId', CurrencyController.getCurrentRate);

/**
 * @route   GET /api/currency/code/:code
 * @desc    جلب السعر الحالي حسب كود العملة
 * @access  Public
 */
router.get('/code/:code', CurrencyController.getRateByCode);

/**
 * @route   GET /api/currency/history/:currencyId
 * @desc    جلب تاريخ أسعار العملة
 * @access  Public
 */
router.get('/history/:currencyId', CurrencyController.getRateHistory);

/**
 * @route   POST /api/currency/convert
 * @desc    تحويل العملات
 * @access  Public
 */
router.post('/convert', CurrencyController.convert);

/**
 * @route   GET /api/currency/compare
 * @desc    مقارنة أسعار العملات
 * @access  Public
 */
router.get('/compare', CurrencyController.compareRates);

/**
 * @route   GET /api/currency/statistics/:currencyId
 * @desc    جلب إحصائيات أسعار العملة
 * @access  Public
 */
router.get('/statistics/:currencyId', CurrencyController.getStatistics);

// =====================================================
// مسارات محمية (تتطلب تسجيل دخول)
// Protected Routes
// =====================================================

/**
 * @route   POST /api/currency/rates
 * @desc    إنشاء سعر عملة جديد
 * @access  Private (Manager, Admin)
 */
router.post('/rates', 
    validateSession,
    requireRole(['admin', 'manager']),
    csrfProtection,
    CurrencyController.createRate
);

/**
 * @route   PUT /api/currency/rates/:id
 * @desc    تحديث سعر عملة
 * @access  Private (Manager, Admin)
 */
router.put('/rates/:id', 
    validateSession,
    requireRole(['admin', 'manager']),
    csrfProtection,
    CurrencyController.updateRate
);

/**
 * @route   DELETE /api/currency/rates/:id
 * @desc    حذف سعر عملة
 * @access  Private (Admin only)
 */
router.delete('/rates/:id', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    CurrencyController.deleteRate
);

/**
 * @route   POST /api/currency/bulk-update
 * @desc    تحديث جميع أسعار العملات
 * @access  Private (Admin only)
 */
router.post('/bulk-update', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    CurrencyController.bulkUpdate
);

// =====================================================
// تصدير المسار
// Export router
// =====================================================
module.exports = router;