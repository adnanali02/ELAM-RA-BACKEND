/**
 * =====================================================
 * متحكم المصادقة
 * Authentication Controller
 * =====================================================
 * الملف: backend/controllers/authController.js
 * الغرض: التحكم في عمليات تسجيل الدخول والخروج
 * =====================================================
 */

const User = require('../models/User');
const { Security, SECURITY_CONFIG } = require('../config/security');
const db = require('../config/database');

// =====================================================
// فئة متحكم المصادقة
// Auth Controller Class
// =====================================================
class AuthController {
    /**
     * تسجيل الدخول
     * Login
     */
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // التحقق من المدخلات
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // تطهير المدخلات
            const sanitizedUsername = Security.sanitizeInput(username);

            // محاولة تسجيل الدخول
            const user = await User.login(sanitizedUsername, password, ipAddress, userAgent);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // إنشاء جلسة جديدة
            const sessionToken = Security.generateSessionId();
            const csrfToken = Security.generateCSRFToken();
            const expiresAt = new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT * 1000);

            // حفظ الجلسة في قاعدة البيانات
            await db.run(
                `INSERT INTO sessions (user_id, session_token, csrf_token, ip_address, user_agent, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [user.id, sessionToken, csrfToken, ipAddress, userAgent, expiresAt.toISOString()]
            );

            // إعداد الجلسة
            req.session.userId = user.id;
            req.session.token = sessionToken;
            req.session.csrfToken = csrfToken;
            req.session.role = user.role;

            // إعداد الكوكيز
            res.cookie('session_token', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: SECURITY_CONFIG.COOKIE_MAX_AGE,
                path: '/'
            });

            res.cookie('csrf_token', csrfToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: SECURITY_CONFIG.COOKIE_MAX_AGE,
                path: '/'
            });

            // إرجاع الاستجابة
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: user.toJSON(),
                    csrfToken: csrfToken
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            
            // عدم كشف معلومات حساسة
            const message = error.message.includes('locked') 
                ? error.message 
                : 'Invalid credentials';
            
            return res.status(401).json({
                success: false,
                message: message,
                code: 'LOGIN_FAILED'
            });
        }
    }

    /**
     * تسجيل الخروج
     * Logout
     */
    static async logout(req, res) {
        try {
            const sessionToken = req.session?.token;

            if (sessionToken) {
                // إلغاء الجلسة من قاعدة البيانات
                await db.run(
                    'UPDATE sessions SET is_valid = 0 WHERE session_token = ?',
                    [sessionToken]
                );
            }

            // تدمير الجلسة
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
            });

            // مسح الكوكيز
            res.clearCookie('session_token');
            res.clearCookie('csrf_token');

            return res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Logout failed',
                code: 'LOGOUT_ERROR'
            });
        }
    }

    /**
     * التحقق من الجلسة
     * Check session
     */
    static async checkSession(req, res) {
        try {
            if (!req.session || !req.session.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'No active session',
                    code: 'NO_SESSION'
                });
            }

            const user = await User.findById(req.session.userId);
            
            if (!user || !user.isActive) {
                req.session.destroy();
                return res.status(401).json({
                    success: false,
                    message: 'Session invalid',
                    code: 'SESSION_INVALID'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    user: user.toJSON(),
                    csrfToken: req.session.csrfToken
                }
            });
        } catch (error) {
            console.error('Check session error:', error);
            return res.status(500).json({
                success: false,
                message: 'Session check failed',
                code: 'SESSION_CHECK_ERROR'
            });
        }
    }

    /**
     * تغيير كلمة المرور
     * Change password
     */
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.session?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            // التحقق من المدخلات
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required',
                    code: 'MISSING_PASSWORDS'
                });
            }

            // التحقق من قوة كلمة المرور الجديدة
            if (!Security.isStrongPassword(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'New password does not meet strength requirements',
                    code: 'WEAK_PASSWORD',
                    requirements: {
                        minLength: 8,
                        uppercase: true,
                        lowercase: true,
                        number: true,
                        special: true
                    }
                });
            }

            // تغيير كلمة المرور
            await User.changePassword(userId, currentPassword, newPassword);

            // تسجيل الخروج من جميع الجلسات
            await db.run(
                'UPDATE sessions SET is_valid = 0 WHERE user_id = ? AND session_token != ?',
                [userId, req.session.token]
            );

            return res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            
            const message = error.message.includes('incorrect') 
                ? 'Current password is incorrect'
                : 'Password change failed';
            
            return res.status(400).json({
                success: false,
                message: message,
                code: 'PASSWORD_CHANGE_FAILED'
            });
        }
    }

    /**
     * تجديد الجلسة
     * Refresh session
     */
    static async refreshSession(req, res) {
        try {
            const sessionToken = req.session?.token;

            if (!sessionToken) {
                return res.status(401).json({
                    success: false,
                    message: 'No session to refresh',
                    code: 'NO_SESSION'
                });
            }

            // التحقق من صلاحية الجلسة
            const session = await db.get(
                'SELECT * FROM sessions WHERE session_token = ? AND is_valid = 1',
                [sessionToken]
            );

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Session invalid',
                    code: 'SESSION_INVALID'
                });
            }

            // تجديد وقت انتهاء الجلسة
            const newExpiresAt = new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT * 1000);
            
            await db.run(
                'UPDATE sessions SET expires_at = ? WHERE id = ?',
                [newExpiresAt.toISOString(), session.id]
            );

            return res.status(200).json({
                success: true,
                message: 'Session refreshed',
                expiresAt: newExpiresAt.toISOString()
            });
        } catch (error) {
            console.error('Refresh session error:', error);
            return res.status(500).json({
                success: false,
                message: 'Session refresh failed',
                code: 'REFRESH_ERROR'
            });
        }
    }

    /**
     * الحصول على CSRF Token
     * Get CSRF token
     */
    static async getCSRFToken(req, res) {
        try {
            // إنشاء توكن جديد للزوار
            const csrfToken = Security.generateCSRFToken();
            
            res.cookie('csrf_token', csrfToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: SECURITY_CONFIG.COOKIE_MAX_AGE,
                path: '/'
            });

            return res.status(200).json({
                success: true,
                data: {
                    csrfToken: csrfToken
                }
            });
        } catch (error) {
            console.error('Get CSRF token error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate CSRF token',
                code: 'CSRF_ERROR'
            });
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = AuthController;