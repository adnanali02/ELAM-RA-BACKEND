/**
 * =====================================================
 * نموذج إعدادات المتجر
 * Store Settings Model
 * =====================================================
 * الملف: backend/models/StoreSettings.js
 * الغرض: إدارة إعدادات المتجر والمعلومات
 * =====================================================
 */

const db = require('../config/database');

// =====================================================
// فئة إعدادات المتجر
// Store Settings Class
// =====================================================
class StoreSettings {
    /**
     * إنشاء كائن إعدادات
     * Create settings object
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.key = data.setting_key || '';
        this.value = data.setting_value || '';
        this.type = data.setting_type || 'string';
        this.description = data.description || '';
        this.updatedBy = data.updated_by || null;
        this.updatedAt = data.updated_at || null;
    }

    /**
     * الحصول على القيمة المحولة
     * Get typed value
     */
    getTypedValue() {
        switch (this.type) {
            case 'integer':
                return parseInt(this.value, 10) || 0;
            case 'decimal':
                return parseFloat(this.value) || 0;
            case 'boolean':
                return this.value === '1' || this.value === 'true';
            case 'json':
                try {
                    return JSON.parse(this.value);
                } catch {
                    return {};
                }
            case 'string':
            default:
                return this.value;
        }
    }

    /**
     * تحويل إلى كائن JSON
     * Convert to JSON
     */
    toJSON() {
        return {
            key: this.key,
            value: this.getTypedValue(),
            type: this.type,
            description: this.description,
            updatedAt: this.updatedAt
        };
    }

    // =====================================================
    // العمليات الثابتة (Static Methods)
    // =====================================================

    /**
     * الحصول على إعداد
     * Get setting by key
     */
    static async get(key, defaultValue = null) {
        try {
            const row = await db.get(
                'SELECT * FROM store_settings WHERE setting_key = ?',
                [key]
            );
            
            if (!row) {
                return defaultValue;
            }

            const setting = new StoreSettings(row);
            return setting.getTypedValue();
        } catch (error) {
            console.error('Error getting setting:', error);
            return defaultValue;
        }
    }

    /**
     * الحصول على كائن الإعداد الكامل
     * Get full setting object
     */
    static async getSetting(key) {
        try {
            const row = await db.get(
                'SELECT * FROM store_settings WHERE setting_key = ?',
                [key]
            );
            
            return row ? new StoreSettings(row) : null;
        } catch (error) {
            console.error('Error getting setting object:', error);
            return null;
        }
    }

    /**
     * تعيين إعداد
     * Set setting
     */
    static async set(key, value, type = 'string', updatedBy = null) {
        try {
            // تحويل القيمة إلى نص
            let stringValue;
            switch (type) {
                case 'json':
                    stringValue = JSON.stringify(value);
                    break;
                case 'boolean':
                    stringValue = value ? '1' : '0';
                    break;
                default:
                    stringValue = String(value);
            }

            // التحقق من وجود الإعداد
            const existing = await db.get(
                'SELECT id FROM store_settings WHERE setting_key = ?',
                [key]
            );

            if (existing) {
                // تحديث
                await db.run(
                    `UPDATE store_settings 
                     SET setting_value = ?, setting_type = ?, updated_by = ?, updated_at = datetime('now')
                     WHERE setting_key = ?`,
                    [stringValue, type, updatedBy, key]
                );
            } else {
                // إنشاء
                await db.run(
                    `INSERT INTO store_settings (setting_key, setting_value, setting_type, updated_by)
                     VALUES (?, ?, ?, ?)`,
                    [key, stringValue, type, updatedBy]
                );
            }

            // تسجيل التغيير
            await StoreSettings.logChange(key, 'SET', updatedBy, { value, type });

            return true;
        } catch (error) {
            console.error('Error setting value:', error);
            throw error;
        }
    }

    /**
     * حذف إعداد
     * Delete setting
     */
    static async delete(key, deletedBy = null) {
        try {
            const setting = await StoreSettings.getSetting(key);
            if (!setting) {
                return false;
            }

            // تسجيل الحذف
            await StoreSettings.logChange(key, 'DELETE', deletedBy, setting.toJSON());

            // حذف
            await db.run(
                'DELETE FROM store_settings WHERE setting_key = ?',
                [key]
            );

            return true;
        } catch (error) {
            console.error('Error deleting setting:', error);
            throw error;
        }
    }

    /**
     * جلب جميع الإعدادات
     * Get all settings
     */
    static async getAll() {
        try {
            const rows = await db.all(
                'SELECT * FROM store_settings ORDER BY setting_key'
            );
            
            const settings = {};
            rows.forEach(row => {
                const setting = new StoreSettings(row);
                settings[setting.key] = setting.getTypedValue();
            });

            return settings;
        } catch (error) {
            console.error('Error getting all settings:', error);
            throw error;
        }
    }

    /**
     * جلب جميع الإعدادات ككائنات
     * Get all settings as objects
     */
    static async getAllSettings() {
        try {
            const rows = await db.all(
                'SELECT * FROM store_settings ORDER BY setting_key'
            );
            
            return rows.map(row => new StoreSettings(row));
        } catch (error) {
            console.error('Error getting all settings objects:', error);
            throw error;
        }
    }

    /**
     * الحصول على معلومات المتجر
     * Get store info
     */
    static async getStoreInfo() {
        try {
            const keys = [
                'store_name',
                'store_name_en',
                'store_address',
                'store_phone',
                'store_whatsapp',
                'store_instagram',
                'store_facebook'
            ];

            const info = {};
            for (const key of keys) {
                info[key] = await StoreSettings.get(key, '');
            }

            return {
                name: info.store_name,
                nameEn: info.store_name_en,
                address: info.store_address,
                phone: info.store_phone,
                whatsapp: info.store_whatsapp,
                instagram: info.store_instagram,
                facebook: info.store_facebook
            };
        } catch (error) {
            console.error('Error getting store info:', error);
            throw error;
        }
    }

    /**
     * تحديث معلومات المتجر
     * Update store info
     */
    static async updateStoreInfo(info, updatedBy = null) {
        try {
            const mappings = {
                name: 'store_name',
                nameEn: 'store_name_en',
                address: 'store_address',
                phone: 'store_phone',
                whatsapp: 'store_whatsapp',
                instagram: 'store_instagram',
                facebook: 'store_facebook'
            };

            for (const [key, dbKey] of Object.entries(mappings)) {
                if (info[key] !== undefined) {
                    await StoreSettings.set(dbKey, info[key], 'string', updatedBy);
                }
            }

            return await StoreSettings.getStoreInfo();
        } catch (error) {
            console.error('Error updating store info:', error);
            throw error;
        }
    }

    /**
     * الحصول على إعدادات السوق
     * Get market settings
     */
    static async getMarketSettings() {
        try {
            const keys = [
                'market_open_time',
                'market_close_time',
                'market_timezone',
                'market_days'
            ];

            const settings = {};
            for (const key of keys) {
                settings[key] = await StoreSettings.get(key, '');
            }

            return {
                openTime: settings.market_open_time,
                closeTime: settings.market_close_time,
                timezone: settings.market_timezone,
                days: settings.market_days ? settings.market_days.split(',').map(Number) : [1, 2, 3, 4, 5, 6]
            };
        } catch (error) {
            console.error('Error getting market settings:', error);
            throw error;
        }
    }

    /**
     * الحصول على إعدادات الهوامش
     * Get margin settings
     */
    static async getMarginSettings() {
        try {
            return {
                gold: {
                    buy: await StoreSettings.get('default_gold_margin_buy', 0.02),
                    sell: await StoreSettings.get('default_gold_margin_sell', 0.02)
                },
                currency: {
                    buy: await StoreSettings.get('default_currency_margin_buy', 0.015),
                    sell: await StoreSettings.get('default_currency_margin_sell', 0.015)
                }
            };
        } catch (error) {
            console.error('Error getting margin settings:', error);
            throw error;
        }
    }

    /**
     * الحصول على إعدادات الأمان
     * Get security settings
     */
    static async getSecuritySettings() {
        try {
            return {
                sessionTimeout: await StoreSettings.get('session_timeout', 3600),
                maxLoginAttempts: await StoreSettings.get('max_login_attempts', 5),
                lockoutDuration: await StoreSettings.get('lockout_duration', 900)
            };
        } catch (error) {
            console.error('Error getting security settings:', error);
            throw error;
        }
    }

    /**
     * التحقق من حالة السوق
     * Check market status
     */
    static async isMarketOpen() {
        try {
            const settings = await StoreSettings.getMarketSettings();
            
            const now = new Date();
            const timezone = settings.timezone || 'Asia/Riyadh';
            
            // تحويل الوقت الحالي إلى المنطقة الزمنية المحددة
            const options = { timeZone: timezone, hour12: false };
            const timeString = now.toLocaleTimeString('en-US', options);
            const currentTime = timeString.substring(0, 5);
            
            // الحصول على اليوم الحالي (0 = الأحد)
            const dayOptions = { timeZone: timezone, weekday: 'short' };
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDay = dayNames.indexOf(now.toLocaleDateString('en-US', dayOptions));

            // التحقق من يوم العمل
            if (!settings.days.includes(currentDay)) {
                return false;
            }

            // التحقق من وقت العمل
            return currentTime >= settings.openTime && currentTime <= settings.closeTime;
        } catch (error) {
            console.error('Error checking market status:', error);
            return false;
        }
    }

    /**
     * تسجيل التغييرات
     * Log changes
     */
    static async logChange(key, action, performedBy, details) {
        try {
            await db.run(
                `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, created_at)
                 VALUES (?, ?, 'STORE_SETTING', ?, ?, datetime('now'))`,
                [performedBy, action, key, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Error logging setting change:', error);
        }
    }

    /**
     * إعادة تعيين الإعدادات الافتراضية
     * Reset to defaults
     */
    static async resetToDefaults(updatedBy = null) {
        try {
            const defaults = [
                { key: 'store_name', value: 'مصنوعات الأميرة', type: 'string' },
                { key: 'store_name_en', value: 'Princess Gold', type: 'string' },
                { key: 'store_address', value: 'الرياض، المملكة العربية السعودية', type: 'string' },
                { key: 'store_phone', value: '+966 50 000 0000', type: 'string' },
                { key: 'store_whatsapp', value: '+966 50 000 0000', type: 'string' },
                { key: 'store_instagram', value: '@princess.gold', type: 'string' },
                { key: 'store_facebook', value: 'PrincessGold', type: 'string' },
                { key: 'market_open_time', value: '08:00', type: 'string' },
                { key: 'market_close_time', value: '22:00', type: 'string' },
                { key: 'market_timezone', value: 'Asia/Riyadh', type: 'string' },
                { key: 'market_days', value: '1,2,3,4,5,6', type: 'string' },
                { key: 'default_gold_margin_buy', value: '0.02', type: 'decimal' },
                { key: 'default_gold_margin_sell', value: '0.02', type: 'decimal' },
                { key: 'default_currency_margin_buy', value: '0.015', type: 'decimal' },
                { key: 'default_currency_margin_sell', value: '0.015', type: 'decimal' },
                { key: 'session_timeout', value: '3600', type: 'integer' },
                { key: 'max_login_attempts', value: '5', type: 'integer' },
                { key: 'lockout_duration', value: '900', type: 'integer' }
            ];

            for (const def of defaults) {
                await StoreSettings.set(def.key, def.value, def.type, updatedBy);
            }

            return true;
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw error;
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = StoreSettings;