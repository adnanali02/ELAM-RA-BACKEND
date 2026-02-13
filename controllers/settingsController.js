/**
 * =====================================================
 * متحكم الإعدادات
 * Settings Controller
 * =====================================================
 * الملف: backend/controllers/settingsController.js
 * الغرض: التحكم في عمليات إدارة الإعدادات
 * =====================================================
 */

const StoreSettings = require('../models/StoreSettings');

// =====================================================
// فئة متحكم الإعدادات
// Settings Controller Class
// =====================================================
class SettingsController {
    /**
     * جلب جميع الإعدادات
     * Get all settings
     */
    static async getAllSettings(req, res) {
        try {
            const settings = await StoreSettings.getAll();

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Get all settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve settings',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب إعداد محدد
     * Get specific setting
     */
    static async getSetting(req, res) {
        try {
            const { key } = req.params;
            const value = await StoreSettings.get(key);

            if (value === null) {
                return res.status(404).json({
                    success: false,
                    message: 'Setting not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    key,
                    value
                }
            });
        } catch (error) {
            console.error('Get setting error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve setting',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تعيين إعداد
     * Set setting
     */
    static async setSetting(req, res) {
        try {
            const { key } = req.params;
            const { value, type } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من المدخلات
            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Value is required',
                    code: 'MISSING_VALUE'
                });
            }

            // تعيين الإعداد
            await StoreSettings.set(key, value, type || 'string', updatedBy);

            return res.status(200).json({
                success: true,
                message: 'Setting updated successfully',
                data: {
                    key,
                    value
                }
            });
        } catch (error) {
            console.error('Set setting error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to set setting',
                code: 'SET_ERROR'
            });
        }
    }

    /**
     * حذف إعداد
     * Delete setting
     */
    static async deleteSetting(req, res) {
        try {
            const { key } = req.params;
            const deletedBy = req.session?.userId;

            const result = await StoreSettings.delete(key, deletedBy);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Setting not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Setting deleted successfully'
            });
        } catch (error) {
            console.error('Delete setting error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete setting',
                code: 'DELETE_ERROR'
            });
        }
    }

    /**
     * جلب معلومات المتجر
     * Get store info
     */
    static async getStoreInfo(req, res) {
        try {
            const info = await StoreSettings.getStoreInfo();

            return res.status(200).json({
                success: true,
                data: info
            });
        } catch (error) {
            console.error('Get store info error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve store info',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث معلومات المتجر
     * Update store info
     */
    static async updateStoreInfo(req, res) {
        try {
            const { name, nameEn, address, phone, whatsapp, instagram, facebook } = req.body;
            const updatedBy = req.session?.userId;

            const info = {};
            if (name !== undefined) info.name = name;
            if (nameEn !== undefined) info.nameEn = nameEn;
            if (address !== undefined) info.address = address;
            if (phone !== undefined) info.phone = phone;
            if (whatsapp !== undefined) info.whatsapp = whatsapp;
            if (instagram !== undefined) info.instagram = instagram;
            if (facebook !== undefined) info.facebook = facebook;

            const updatedInfo = await StoreSettings.updateStoreInfo(info, updatedBy);

            return res.status(200).json({
                success: true,
                message: 'Store info updated successfully',
                data: updatedInfo
            });
        } catch (error) {
            console.error('Update store info error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update store info',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * جلب إعدادات السوق
     * Get market settings
     */
    static async getMarketSettings(req, res) {
        try {
            const settings = await StoreSettings.getMarketSettings();

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Get market settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve market settings',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث إعدادات السوق
     * Update market settings
     */
    static async updateMarketSettings(req, res) {
        try {
            const { openTime, closeTime, timezone, days } = req.body;
            const updatedBy = req.session?.userId;

            const settings = {};
            if (openTime !== undefined) settings.openTime = openTime;
            if (closeTime !== undefined) settings.closeTime = closeTime;
            if (timezone !== undefined) settings.timezone = timezone;
            if (days !== undefined) settings.days = days;

            const mappings = {
                openTime: 'market_open_time',
                closeTime: 'market_close_time',
                timezone: 'market_timezone',
                days: 'market_days'
            };

            for (const [key, dbKey] of Object.entries(mappings)) {
                if (settings[key] !== undefined) {
                    const value = key === 'days' && Array.isArray(settings[key]) 
                        ? settings[key].join(',') 
                        : settings[key];
                    await StoreSettings.set(dbKey, value, 'string', updatedBy);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Market settings updated successfully',
                data: await StoreSettings.getMarketSettings()
            });
        } catch (error) {
            console.error('Update market settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update market settings',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * جلب إعدادات الهوامش
     * Get margin settings
     */
    static async getMarginSettings(req, res) {
        try {
            const settings = await StoreSettings.getMarginSettings();

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Get margin settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve margin settings',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث إعدادات الهوامش
     * Update margin settings
     */
    static async updateMarginSettings(req, res) {
        try {
            const { gold, currency } = req.body;
            const updatedBy = req.session?.userId;

            if (gold) {
                if (gold.buy !== undefined) {
                    await StoreSettings.set('default_gold_margin_buy', gold.buy, 'decimal', updatedBy);
                }
                if (gold.sell !== undefined) {
                    await StoreSettings.set('default_gold_margin_sell', gold.sell, 'decimal', updatedBy);
                }
            }

            if (currency) {
                if (currency.buy !== undefined) {
                    await StoreSettings.set('default_currency_margin_buy', currency.buy, 'decimal', updatedBy);
                }
                if (currency.sell !== undefined) {
                    await StoreSettings.set('default_currency_margin_sell', currency.sell, 'decimal', updatedBy);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Margin settings updated successfully',
                data: await StoreSettings.getMarginSettings()
            });
        } catch (error) {
            console.error('Update margin settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update margin settings',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * جلب إعدادات الأمان
     * Get security settings
     */
    static async getSecuritySettings(req, res) {
        try {
            const settings = await StoreSettings.getSecuritySettings();

            return res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('Get security settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve security settings',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث إعدادات الأمان
     * Update security settings
     */
    static async updateSecuritySettings(req, res) {
        try {
            const { sessionTimeout, maxLoginAttempts, lockoutDuration } = req.body;
            const updatedBy = req.session?.userId;

            if (sessionTimeout !== undefined) {
                await StoreSettings.set('session_timeout', sessionTimeout, 'integer', updatedBy);
            }
            if (maxLoginAttempts !== undefined) {
                await StoreSettings.set('max_login_attempts', maxLoginAttempts, 'integer', updatedBy);
            }
            if (lockoutDuration !== undefined) {
                await StoreSettings.set('lockout_duration', lockoutDuration, 'integer', updatedBy);
            }

            return res.status(200).json({
                success: true,
                message: 'Security settings updated successfully',
                data: await StoreSettings.getSecuritySettings()
            });
        } catch (error) {
            console.error('Update security settings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update security settings',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * التحقق من حالة السوق
     * Check market status
     */
    static async checkMarketStatus(req, res) {
        try {
            const isOpen = await StoreSettings.isMarketOpen();
            const settings = await StoreSettings.getMarketSettings();

            return res.status(200).json({
                success: true,
                data: {
                    isOpen,
                    settings
                }
            });
        } catch (error) {
            console.error('Check market status error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to check market status',
                code: 'CHECK_ERROR'
            });
        }
    }

    /**
     * إعادة تعيين الإعدادات الافتراضية
     * Reset to defaults
     */
    static async resetToDefaults(req, res) {
        try {
            const updatedBy = req.session?.userId;

            await StoreSettings.resetToDefaults(updatedBy);

            return res.status(200).json({
                success: true,
                message: 'Settings reset to defaults successfully',
                data: await StoreSettings.getAll()
            });
        } catch (error) {
            console.error('Reset to defaults error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to reset settings',
                code: 'RESET_ERROR'
            });
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = SettingsController;