/**
 * =====================================================
 * مسارات الإعدادات
 * Settings Routes
 * =====================================================
 * الملف: backend/routes/settings.js
 * الغرض: تعريف مسارات إدارة الإعدادات
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const { 
    validateSession, 
    requireRole, 
    csrfProtection 
} = require('../middleware/security');

// =====================================================
// مسارات عامة
// Public Routes
// =====================================================

/**
 * @route   GET /api/settings/store
 * @desc    جلب معلومات المتجر
 * @access  Public
 */
router.get('/store', SettingsController.getStoreInfo);

/**
 * @route   GET /api/settings/market/status
 * @desc    التحقق من حالة السوق
 * @access  Public
 */
router.get('/market/status', SettingsController.checkMarketStatus);

// =====================================================
// مسارات محمية
// Protected Routes
// =====================================================

/**
 * @route   GET /api/settings
 * @desc    جلب جميع الإعدادات
 * @access  Private (Admin only)
 */
router.get('/', 
    validateSession,
    requireRole(['admin']),
    SettingsController.getAllSettings
);

/**
 * @route   GET /api/settings/:key
 * @desc    جلب إعداد محدد
 * @access  Private (Admin only)
 */
router.get('/:key', 
    validateSession,
    requireRole(['admin']),
    SettingsController.getSetting
);

/**
 * @route   PUT /api/settings/:key
 * @desc    تعيين إعداد
 * @access  Private (Admin only)
 */
router.put('/:key', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.setSetting
);

/**
 * @route   DELETE /api/settings/:key
 * @desc    حذف إعداد
 * @access  Private (Admin only)
 */
router.delete('/:key', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.deleteSetting
);

// =====================================================
// مسارات معلومات المتجر
// Store Info Routes
// =====================================================

/**
 * @route   PUT /api/settings/store
 * @desc    تحديث معلومات المتجر
 * @access  Private (Admin only)
 */
router.put('/store', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.updateStoreInfo
);

// =====================================================
// مسارات إعدادات السوق
// Market Settings Routes
// =====================================================

/**
 * @route   GET /api/settings/market
 * @desc    جلب إعدادات السوق
 * @access  Private (Admin only)
 */
router.get('/market', 
    validateSession,
    requireRole(['admin']),
    SettingsController.getMarketSettings
);

/**
 * @route   PUT /api/settings/market
 * @desc    تحديث إعدادات السوق
 * @access  Private (Admin only)
 */
router.put('/market', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.updateMarketSettings
);

// =====================================================
// مسارات إعدادات الهوامش
// Margin Settings Routes
// =====================================================

/**
 * @route   GET /api/settings/margins
 * @desc    جلب إعدادات الهوامش
 * @access  Private (Admin only)
 */
router.get('/margins', 
    validateSession,
    requireRole(['admin']),
    SettingsController.getMarginSettings
);

/**
 * @route   PUT /api/settings/margins
 * @desc    تحديث إعدادات الهوامش
 * @access  Private (Admin only)
 */
router.put('/margins', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.updateMarginSettings
);

// =====================================================
// مسارات إعدادات الأمان
// Security Settings Routes
// =====================================================

/**
 * @route   GET /api/settings/security
 * @desc    جلب إعدادات الأمان
 * @access  Private (Admin only)
 */
router.get('/security', 
    validateSession,
    requireRole(['admin']),
    SettingsController.getSecuritySettings
);

/**
 * @route   PUT /api/settings/security
 * @desc    تحديث إعدادات الأمان
 * @access  Private (Admin only)
 */
router.put('/security', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.updateSecuritySettings
);

/**
 * @route   POST /api/settings/reset
 * @desc    إعادة تعيين الإعدادات الافتراضية
 * @access  Private (Admin only)
 */
router.post('/reset', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    SettingsController.resetToDefaults
);

// =====================================================
// تصدير المسار
// Export router
// =====================================================
module.exports = router;