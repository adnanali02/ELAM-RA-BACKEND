/**
 * =====================================================
 * إعدادات الأمان
 * Security Configuration
 * =====================================================
 * الملف: backend/config/security.js
 * الغرض: إعدادات الأمان والحماية للتطبيق
 * =====================================================
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// =====================================================
// ثوابت الأمان
// Security Constants
// =====================================================
const SECURITY_CONFIG = {
    // bcrypt
    BCRYPT_ROUNDS: 12,
    
    // الجلسات
    SESSION_TIMEOUT: 3600, // ثانية
    SESSION_SECRET_LENGTH: 64,
    
    // CSRF
    CSRF_TOKEN_LENGTH: 32,
    CSRF_TOKEN_EXPIRY: 3600, // ثانية
    
    // Rate Limiting
    RATE_LIMIT_WINDOW: 900000, // 15 دقيقة بالمللي ثانية
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // Brute Force Protection
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // ثانية
    
    // Cookies
    COOKIE_MAX_AGE: 86400000, // 24 ساعة بالمللي ثانية
    
    // CSP
    CSP_NONCE_LENGTH: 16,
};

// =====================================================
// إعدادات Content Security Policy
// Content Security Policy Settings
// =====================================================
const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
};

// =====================================================
// إعدادات Headers الأمان
// Security Headers
// =====================================================
const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

// =====================================================
// فئة الأمان
// Security Class
// =====================================================
class Security {
    /**
     * إنشاء هاش لكلمة المرور
     * Hash password using bcrypt
     */
    static async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(SECURITY_CONFIG.BCRYPT_ROUNDS);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        } catch (error) {
            console.error('Password hashing error:', error);
            throw new Error('Failed to hash password');
        }
    }

    /**
     * التحقق من كلمة المرور
     * Verify password against hash
     */
    static async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    }

    /**
     * إنشاء توكن عشوائي
     * Generate random token
     */
    static generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * إنشاء CSRF Token
     * Generate CSRF token
     */
    static generateCSRFToken() {
        return this.generateToken(SECURITY_CONFIG.CSRF_TOKEN_LENGTH);
    }

    /**
     * إنشاء معرف جلسة
     * Generate session ID
     */
    static generateSessionId() {
        return crypto.randomBytes(32).toString('base64');
    }

    /**
     * تشفير البيانات
     * Encrypt data
     */
    static encrypt(data, key) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * فك تشفير البيانات
     * Decrypt data
     */
    static decrypt(encryptedData, key, iv, authTag) {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                Buffer.from(key, 'hex'),
                Buffer.from(iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * إنشاء مفتاح تشفير
     * Generate encryption key
     */
    static generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * تجزئة البيانات
     * Hash data using SHA-256
     */
    static hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * تطهير المدخلات
     * Sanitize input
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        // إزالة الفراغات من البداية والنهاية
        let sanitized = input.trim();
        
        // تحويل الأحرف الخاصة إلى كيانات HTML
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        
        return sanitized;
    }

    /**
     * تطهير المخرجات
     * Escape output
     */
    static escapeOutput(output) {
        return this.sanitizeInput(output);
    }

    /**
     * التحقق من صحة البريد الإلكتروني
     * Validate email
     */
    static isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    /**
     * التحقق من قوة كلمة المرور
     * Validate password strength
     */
    static isStrongPassword(password) {
        // 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، رمز خاص
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongRegex.test(password);
    }

    /**
     * التحقق من صحة اسم المستخدم
     * Validate username
     */
    static isValidUsername(username) {
        // 3-20 حرف، حروف وأرقام وشرطة سفلية فقط
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    /**
     * إنشاء CSP Header
     * Generate CSP header
     */
    static generateCSP(nonce = null) {
        const directives = { ...CSP_DIRECTIVES };
        
        if (nonce) {
            directives['script-src'] = [`'nonce-${nonce}'`, "'strict-dynamic'"];
        }
        
        return Object.entries(directives)
            .map(([key, values]) => `${key} ${values.join(' ')}`)
            .join('; ');
    }

    /**
     * الحصول على Security Headers
     * Get security headers
     */
    static getSecurityHeaders() {
        return {
            ...SECURITY_HEADERS,
            'Content-Security-Policy': this.generateCSP()
        };
    }

    /**
     * التحقق من صحة CSRF Token
     * Validate CSRF token
     */
    static validateCSRFToken(token, sessionToken) {
        if (!token || !sessionToken) {
            return false;
        }
        
        // في الإنتاج: قارن مع التوكن المخزن في الجلسة
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(sessionToken)
        );
    }

    /**
     * إخفاء معلومات حساسة
     * Mask sensitive data
     */
    static maskSensitive(data, visibleChars = 4) {
        if (typeof data !== 'string' || data.length <= visibleChars * 2) {
            return '*'.repeat(data.length);
        }
        
        const start = data.slice(0, visibleChars);
        const end = data.slice(-visibleChars);
        const masked = '*'.repeat(data.length - visibleChars * 2);
        
        return `${start}${masked}${end}`;
    }

    /**
     * إنشاء توقيع للبيانات
     * Sign data with HMAC
     */
    static signData(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    /**
     * التحقق من التوقيع
     * Verify signature
     */
    static verifySignature(data, signature, secret) {
        const expectedSignature = this.signData(data, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}

// =====================================================
// تصدير الإعدادات والفئة
// Export configuration and class
// =====================================================
module.exports = {
    Security,
    SECURITY_CONFIG,
    CSP_DIRECTIVES,
    SECURITY_HEADERS
};