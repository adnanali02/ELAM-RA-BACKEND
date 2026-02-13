/**
 * =====================================================
 * برمجيات وسيطة للتحقق من المصادقة (Authentication Middleware)
 * =====================================================
 */

// التحقق هل المستخدم مسجل دخول أم لا
const isAuthenticated = (req, res, next) => {
    // التحقق من وجود الجلسة ومعرف المستخدم
    if (req.session && req.session.userId) {
        return next();
    }
    
    // إذا لم يكن مسجلاً، أرسل خطأ 401
    return res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً (Unauthorized)',
        code: 'AUTH_REQUIRED'
    });
};

// التحقق هل المستخدم "مدير" (Admin)
const isAdmin = (req, res, next) => {
    // أولاً نتحقق أنه مسجل دخول
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'يجب تسجيل الدخول أولاً',
            code: 'AUTH_REQUIRED'
        });
    }

    // ثانياً نتحقق من دوره (Role)
    if (req.session.role === 'admin') {
        return next();
    }

    // إذا لم يكن مديراً، أرسل خطأ 403 (ممنوع)
    return res.status(403).json({ 
        success: false, 
        message: 'ليس لديك صلاحية المدير (Admin Access Required)',
        code: 'FORBIDDEN'
    });
};

module.exports = { isAuthenticated, isAdmin };