/**
 * =====================================================
 * نموذج المستخدم
 * User Model
 * =====================================================
 * الملف: backend/models/User.js
 * الغرض: إدارة بيانات المستخدمين والعمليات عليها
 * =====================================================
 */

const db = require('../config/database');
const { Security } = require('../middleware/security');

// =====================================================
// فئة المستخدم
// User Class
// =====================================================
class User {
    /**
     * إنشاء كائن مستخدم جديد
     * Create new user object
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.username = data.username || '';
        this.email = data.email || '';
        this.passwordHash = data.password_hash || '';
        this.fullName = data.full_name || '';
        this.role = data.role || 'user';
        this.isActive = data.is_active !== undefined ? data.is_active : true;
        this.lastLogin = data.last_login || null;
        this.loginAttempts = data.login_attempts || 0;
        this.lockedUntil = data.locked_until || null;
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
        this.createdBy = data.created_by || null;
    }

    /**
     * التحقق من صحة البيانات
     * Validate user data
     */
    validate() {
        const errors = [];

        // التحقق من اسم المستخدم
        if (!this.username || this.username.trim().length === 0) {
            errors.push({
                field: 'username',
                message: 'Username is required',
                code: 'USERNAME_REQUIRED'
            });
        } else if (!Security.isValidUsername(this.username)) {
            errors.push({
                field: 'username',
                message: 'Username must be 3-20 characters, alphanumeric and underscores only',
                code: 'USERNAME_INVALID'
            });
        }

        // التحقق من البريد الإلكتروني
        if (this.email && !Security.isValidEmail(this.email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format',
                code: 'EMAIL_INVALID'
            });
        }

        // التحقق من كلمة المرور (فقط عند الإنشاء)
        if (!this.id && !this.passwordHash) {
            errors.push({
                field: 'password',
                message: 'Password is required',
                code: 'PASSWORD_REQUIRED'
            });
        }

        // التحقق من الدور
        const validRoles = ['admin', 'manager', 'user'];
        if (!validRoles.includes(this.role)) {
            errors.push({
                field: 'role',
                message: 'Invalid role',
                code: 'ROLE_INVALID'
            });
        }

        return errors;
    }

    /**
     * تحويل إلى كائن JSON
     * Convert to JSON object (excluding sensitive data)
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            fullName: this.fullName,
            role: this.role,
            isActive: this.isActive,
            lastLogin: this.lastLogin,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // =====================================================
    // العمليات الثابتة (Static Methods)
    // =====================================================

    /**
     * البحث عن مستخدم بواسطة المعرف
     * Find user by ID
     */
    static async findById(id) {
        try {
            const row = await db.get(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );
            
            return row ? new User(row) : null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * البحث عن مستخدم بواسطة اسم المستخدم
     * Find user by username
     */
    static async findByUsername(username) {
        try {
            const row = await db.get(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            
            return row ? new User(row) : null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    /**
     * البحث عن مستخدم بواسطة البريد الإلكتروني
     * Find user by email
     */
    static async findByEmail(email) {
        try {
            const row = await db.get(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            return row ? new User(row) : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    /**
     * جلب جميع المستخدمين
     * Get all users
     */
    static async findAll(options = {}) {
        try {
            let sql = 'SELECT * FROM users WHERE 1=1';
            const params = [];

            // تصفية حسب الحالة
            if (options.isActive !== undefined) {
                sql += ' AND is_active = ?';
                params.push(options.isActive ? 1 : 0);
            }

            // تصفية حسب الدور
            if (options.role) {
                sql += ' AND role = ?';
                params.push(options.role);
            }

            // الترتيب
            sql += ' ORDER BY created_at DESC';

            // التصفح
            if (options.limit) {
                sql += ' LIMIT ?';
                params.push(options.limit);
                
                if (options.offset) {
                    sql += ' OFFSET ?';
                    params.push(options.offset);
                }
            }

            const rows = await db.all(sql, params);
            return rows.map(row => new User(row));
        } catch (error) {
            console.error('Error finding all users:', error);
            throw error;
        }
    }

    /**
     * إنشاء مستخدم جديد
     * Create new user
     */
    static async create(userData, createdBy = null) {
        try {
            const user = new User(userData);
            
            // التحقق من البيانات
            const errors = user.validate();
            if (errors.length > 0) {
                throw new Error('Validation failed: ' + JSON.stringify(errors));
            }

            // التحقق من عدم وجود المستخدم مسبقاً
            const existingUser = await User.findByUsername(user.username);
            if (existingUser) {
                throw new Error('Username already exists');
            }

            if (user.email) {
                const existingEmail = await User.findByEmail(user.email);
                if (existingEmail) {
                    throw new Error('Email already exists');
                }
            }

            // تشفير كلمة المرور
            let passwordHash = user.passwordHash;
            if (userData.password) {
                passwordHash = await Security.hashPassword(userData.password);
            }

            // إدراج في قاعدة البيانات
            const result = await db.run(
                `INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.username,
                    user.email,
                    passwordHash,
                    user.fullName,
                    user.role,
                    user.isActive ? 1 : 0,
                    createdBy
                ]
            );

            user.id = result.id;
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * تحديث مستخدم
     * Update user
     */
    static async update(id, updateData, updatedBy = null) {
        try {
            const user = await User.findById(id);
            if (!user) {
                throw new Error('User not found');
            }

            // تحديث الحقول
            if (updateData.username) user.username = updateData.username;
            if (updateData.email !== undefined) user.email = updateData.email;
            if (updateData.fullName) user.fullName = updateData.fullName;
            if (updateData.role) user.role = updateData.role;
            if (updateData.isActive !== undefined) user.isActive = updateData.isActive;

            // تشفير كلمة المرور الجديدة
            let passwordHash = user.passwordHash;
            if (updateData.password) {
                passwordHash = await Security.hashPassword(updateData.password);
            }

            // التحقق من البيانات
            const errors = user.validate();
            if (errors.length > 0) {
                throw new Error('Validation failed: ' + JSON.stringify(errors));
            }

            // تحديث في قاعدة البيانات
            await db.run(
                `UPDATE users 
                 SET username = ?, email = ?, password_hash = ?, full_name = ?, 
                     role = ?, is_active = ?, updated_at = datetime('now')
                 WHERE id = ?`,
                [
                    user.username,
                    user.email,
                    passwordHash,
                    user.fullName,
                    user.role,
                    user.isActive ? 1 : 0,
                    id
                ]
            );

            // تسجيل التغيير
            await User.logChange(id, 'UPDATE', updatedBy, updateData);

            return await User.findById(id);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * حذف مستخدم
     * Delete user
     */
    static async delete(id, deletedBy = null) {
        try {
            const user = await User.findById(id);
            if (!user) {
                throw new Error('User not found');
            }

            // عدم السماح بحذف المستخدم الأخير
            const adminCount = await db.get(
                'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = 1'
            );
            
            if (user.role === 'admin' && adminCount.count <= 1) {
                throw new Error('Cannot delete the last admin user');
            }

            // تسجيل الحذف
            await User.logChange(id, 'DELETE', deletedBy, user.toJSON());

            // حذف الجلسات المرتبطة
            await db.run('DELETE FROM sessions WHERE user_id = ?', [id]);

            // حذف المستخدم
            await db.run('DELETE FROM users WHERE id = ?', [id]);

            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * تسجيل دخول المستخدم
     * Login user
     */
    static async login(username, password, ipAddress = null, userAgent = null) {
        try {
            const user = await User.findByUsername(username);
            
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // التحقق من حالة المستخدم
            if (!user.isActive) {
                throw new Error('Account is disabled');
            }

            // التحقق من الحظر
            if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
                const remainingTime = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000);
                throw new Error(`Account locked. Try again in ${remainingTime} seconds`);
            }

            // التحقق من كلمة المرور
            const isValidPassword = await Security.verifyPassword(password, user.passwordHash);
            
            if (!isValidPassword) {
                // زيادة عدد المحاولات
                await User.incrementLoginAttempts(user.id);
                throw new Error('Invalid credentials');
            }

            // إعادة تعيين المحاولات
            await User.resetLoginAttempts(user.id);

            // تحديث آخر تسجيل دخول
            await db.run(
                'UPDATE users SET last_login = datetime("now") WHERE id = ?',
                [user.id]
            );

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * زيادة عدد محاولات تسجيل الدخول
     * Increment login attempts
     */
    static async incrementLoginAttempts(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            const attempts = user.loginAttempts + 1;
            const maxAttempts = 5;
            
            let lockedUntil = null;
            if (attempts >= maxAttempts) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة
            }

            await db.run(
                'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
                [attempts, lockedUntil, userId]
            );
        } catch (error) {
            console.error('Error incrementing login attempts:', error);
        }
    }

    /**
     * إعادة تعيين محاولات تسجيل الدخول
     * Reset login attempts
     */
    static async resetLoginAttempts(userId) {
        try {
            await db.run(
                'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
                [userId]
            );
        } catch (error) {
            console.error('Error resetting login attempts:', error);
        }
    }

    /**
     * تغيير كلمة المرور
     * Change password
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // التحقق من كلمة المرور الحالية
            const isValid = await Security.verifyPassword(currentPassword, user.passwordHash);
            if (!isValid) {
                throw new Error('Current password is incorrect');
            }

            // التحقق من قوة كلمة المرور الجديدة
            if (!Security.isStrongPassword(newPassword)) {
                throw new Error('New password does not meet strength requirements');
            }

            // تشفير وتخزين كلمة المرور الجديدة
            const newHash = await Security.hashPassword(newPassword);
            
            await db.run(
                'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
                [newHash, userId]
            );

            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    /**
     * تسجيل التغييرات
     * Log changes
     */
    static async logChange(userId, action, performedBy, details) {
        try {
            await db.run(
                `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, created_at)
                 VALUES (?, ?, 'USER', ?, ?, datetime('now'))`,
                [performedBy, action, userId, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Error logging user change:', error);
        }
    }

    /**
     * العدد الإجمالي للمستخدمين
     * Get total count
     */
    static async count(options = {}) {
        try {
            let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
            const params = [];

            if (options.isActive !== undefined) {
                sql += ' AND is_active = ?';
                params.push(options.isActive ? 1 : 0);
            }

            if (options.role) {
                sql += ' AND role = ?';
                params.push(options.role);
            }

            const result = await db.get(sql, params);
            return result.count;
        } catch (error) {
            console.error('Error counting users:', error);
            throw error;
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = User;
