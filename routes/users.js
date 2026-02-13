/**
 * =====================================================
 * مسارات المستخدمين
 * Users Routes
 * =====================================================
 * الملف: backend/routes/users.js
 * الغرض: تعريف مسارات إدارة المستخدمين
 * =====================================================
 */

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { 
    validateSession, 
    requireRole, 
    csrfProtection 
} = require('../middleware/security');

// =====================================================
// مسارات الملف الشخصي
// Profile Routes
// =====================================================

/**
 * @route   GET /api/users/profile
 * @desc    جلب الملف الشخصي
 * @access  Private
 */
router.get('/profile', 
    validateSession,
    UserController.getProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    تحديث الملف الشخصي
 * @access  Private
 */
router.put('/profile', 
    validateSession,
    csrfProtection,
    UserController.updateProfile
);

// =====================================================
// مسارات إدارة المستخدمين (تتطلب صلاحيات)
// User Management Routes
// =====================================================

/**
 * @route   GET /api/users
 * @desc    جلب جميع المستخدمين
 * @access  Private (Admin, Manager)
 */
router.get('/', 
    validateSession,
    requireRole(['admin', 'manager']),
    UserController.getAllUsers
);

/**
 * @route   GET /api/users/statistics
 * @desc    جلب إحصائيات المستخدمين
 * @access  Private (Admin only)
 */
router.get('/statistics', 
    validateSession,
    requireRole(['admin']),
    UserController.getStatistics
);

/**
 * @route   GET /api/users/:id
 * @desc    جلب مستخدم حسب المعرف
 * @access  Private (Admin, Manager)
 */
router.get('/:id', 
    validateSession,
    requireRole(['admin', 'manager']),
    UserController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    إنشاء مستخدم جديد
 * @access  Private (Admin only)
 */
router.post('/', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    UserController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    تحديث مستخدم
 * @access  Private (Admin only)
 */
router.put('/:id', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    حذف مستخدم
 * @access  Private (Admin only)
 */
router.delete('/:id', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    UserController.deleteUser
);

/**
 * @route   POST /api/users/:id/change-password
 * @desc    تغيير كلمة مرور المستخدم
 * @access  Private (Admin only)
 */
router.post('/:id/change-password', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    UserController.changeUserPassword
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    تفعيل/تعطيل مستخدم
 * @access  Private (Admin only)
 */
router.put('/:id/status', 
    validateSession,
    requireRole(['admin']),
    csrfProtection,
    UserController.toggleUserStatus
);

// =====================================================
// تصدير المسار
// Export router
// =====================================================
module.exports = router;