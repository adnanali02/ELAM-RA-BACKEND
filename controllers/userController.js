/**
 * =====================================================
 * متحكم المستخدمين
 * Users Controller
 * =====================================================
 * الملف: backend/controllers/userController.js
 * الغرض: التحكم في عمليات إدارة المستخدمين
 * =====================================================
 */

const User = require('../models/User');
const { Security } = require('../config/security');

// =====================================================
// فئة متحكم المستخدمين
// User Controller Class
// =====================================================
class UserController {
    /**
     * جلب جميع المستخدمين
     * Get all users
     */
    static async getAllUsers(req, res) {
        try {
            const { role, isActive, limit, offset } = req.query;
            
            const options = {};
            if (role) options.role = role;
            if (isActive !== undefined) options.isActive = isActive === 'true';
            if (limit) options.limit = parseInt(limit, 10);
            if (offset) options.offset = parseInt(offset, 10);

            const users = await User.findAll(options);

            return res.status(200).json({
                success: true,
                data: users.map(user => user.toJSON()),
                count: users.length
            });
        } catch (error) {
            console.error('Get all users error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve users',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب مستخدم حسب المعرف
     * Get user by ID
     */
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Get user by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve user',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * إنشاء مستخدم جديد
     * Create new user
     */
    static async createUser(req, res) {
        try {
            const { username, email, password, fullName, role } = req.body;
            const createdBy = req.session?.userId;

            // التحقق من المدخلات
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // التحقق من صحة اسم المستخدم
            if (!Security.isValidUsername(username)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid username format',
                    code: 'INVALID_USERNAME',
                    requirements: {
                        minLength: 3,
                        maxLength: 20,
                        allowedChars: 'alphanumeric and underscores only'
                    }
                });
            }

            // التحقق من قوة كلمة المرور
            if (!Security.isStrongPassword(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet strength requirements',
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

            // التحقق من البريد الإلكتروني
            if (email && !Security.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // إنشاء المستخدم
            const user = await User.create({
                username,
                email,
                password,
                fullName,
                role: role || 'user'
            }, createdBy);

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Create user error:', error);
            
            const message = error.message.includes('exists') 
                ? error.message 
                : 'Failed to create user';
            
            return res.status(400).json({
                success: false,
                message: message,
                code: 'CREATE_ERROR'
            });
        }
    }

    /**
     * تحديث مستخدم
     * Update user
     */
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, email, fullName, role, isActive } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من وجود المستخدم
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            // إعداد بيانات التحديث
            const updateData = {};
            if (username !== undefined) updateData.username = username;
            if (email !== undefined) updateData.email = email;
            if (fullName !== undefined) updateData.fullName = fullName;
            if (role !== undefined) updateData.role = role;
            if (isActive !== undefined) updateData.isActive = isActive;

            // التحقق من البريد الإلكتروني
            if (email && !Security.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // تحديث المستخدم
            const user = await User.update(id, updateData, updatedBy);

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Update user error:', error);
            
            const message = error.message.includes('exists') 
                ? error.message 
                : 'Failed to update user';
            
            return res.status(400).json({
                success: false,
                message: message,
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * حذف مستخدم
     * Delete user
     */
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const deletedBy = req.session?.userId;

            // منع حذف النفس
            if (id === String(deletedBy)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account',
                    code: 'SELF_DELETE'
                });
            }

            // التحقق من وجود المستخدم
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            // حذف المستخدم
            await User.delete(id, deletedBy);

            return res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            
            const message = error.message.includes('last') 
                ? error.message 
                : 'Failed to delete user';
            
            return res.status(400).json({
                success: false,
                message: message,
                code: 'DELETE_ERROR'
            });
        }
    }

    /**
     * تغيير كلمة مرور المستخدم
     * Change user password
     */
    static async changeUserPassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من المدخلات
            if (!newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'New password is required',
                    code: 'MISSING_PASSWORD'
                });
            }

            // التحقق من قوة كلمة المرور
            if (!Security.isStrongPassword(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet strength requirements',
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

            // تحديث كلمة المرور
            await User.update(id, { password: newPassword }, updatedBy);

            return res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change user password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to change password',
                code: 'PASSWORD_CHANGE_ERROR'
            });
        }
    }

    /**
     * تفعيل/تعطيل مستخدم
     * Toggle user active status
     */
    static async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const updatedBy = req.session?.userId;

            // منع تعطيل النفس
            if (id === String(updatedBy) && !isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate your own account',
                    code: 'SELF_DEACTIVATE'
                });
            }

            // التحقق من وجود المستخدم
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            // تحديث الحالة
            const user = await User.update(id, { isActive }, updatedBy);

            return res.status(200).json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Toggle user status error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to toggle user status',
                code: 'STATUS_CHANGE_ERROR'
            });
        }
    }

    /**
     * جلب إحصائيات المستخدمين
     * Get user statistics
     */
    static async getStatistics(req, res) {
        try {
            const totalUsers = await User.count();
            const activeUsers = await User.count({ isActive: true });
            const inactiveUsers = await User.count({ isActive: false });
            const adminUsers = await User.count({ role: 'admin' });
            const managerUsers = await User.count({ role: 'manager' });
            const regularUsers = await User.count({ role: 'user' });

            return res.status(200).json({
                success: true,
                data: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: inactiveUsers,
                    byRole: {
                        admin: adminUsers,
                        manager: managerUsers,
                        user: regularUsers
                    }
                }
            });
        } catch (error) {
            console.error('Get user statistics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve user statistics',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب الملف الشخصي
     * Get profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.session?.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve profile',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث الملف الشخصي
     * Update profile
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.session?.userId;
            const { email, fullName } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            // إعداد بيانات التحديث
            const updateData = {};
            if (email !== undefined) updateData.email = email;
            if (fullName !== undefined) updateData.fullName = fullName;

            // التحقق من البريد الإلكتروني
            if (email && !Security.isValidEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format',
                    code: 'INVALID_EMAIL'
                });
            }

            // تحديث الملف الشخصي
            const user = await User.update(userId, updateData, userId);

            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                code: 'UPDATE_ERROR'
            });
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = UserController;