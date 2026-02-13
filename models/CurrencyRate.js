/**
 * =====================================================
 * نموذج أسعار العملات
 * Currency Rate Model
 * =====================================================
 * الملف: backend/models/CurrencyRate.js
 * الغرض: إدارة أسعار العملات والعمليات عليها
 * =====================================================
 */

const db = require('../config/database');

// =====================================================
// فئة أسعار العملات
// Currency Rate Class
// =====================================================
class CurrencyRate {
    /**
     * إنشاء كائن سعر العملة
     * Create currency rate object
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.currencyId = data.currency_id || null;
        this.buyRate = data.buy_rate || 0;
        this.sellRate = data.sell_rate || 0;
        this.spread = data.spread || 0;
        this.marginBuy = data.margin_buy || 0;
        this.marginSell = data.margin_sell || 0;
        this.isManual = data.is_manual || false;
        this.updatedBy = data.updated_by || null;
        this.effectiveFrom = data.effective_from || null;
        this.effectiveUntil = data.effective_until || null;
        this.createdAt = data.created_at || null;
        
        // معلومات إضافية من الانضمام
        this.currencyCode = data.currency_code || null;
        this.currencyName = data.currency_name || null;
        this.currencyNameEn = data.currency_name_en || null;
        this.currencySymbol = data.currency_symbol || null;
        this.flagEmoji = data.flag_emoji || null;
        this.isBase = data.is_base || false;
    }

    /**
     * حساب الفرق (Spread)
     * Calculate spread
     */
    calculateSpread() {
        return this.sellRate - this.buyRate;
    }

    /**
     * حساب الهامش
     * Calculate margin
     */
    calculateMargin(type = 'buy') {
        const rate = type === 'buy' ? this.buyRate : this.sellRate;
        const margin = type === 'buy' ? this.marginBuy : this.marginSell;
        return rate * margin;
    }

    /**
     * الحصول على السعر النهائي
     * Get final rate
     */
    getFinalRate(type = 'buy') {
        const rate = type === 'buy' ? this.buyRate : this.sellRate;
        const margin = this.calculateMargin(type);
        return type === 'buy' ? rate + margin : rate - margin;
    }

    /**
     * تحويل مبلغ من العملة الأساسية
     * Convert amount from base currency
     */
    convertFromBase(amount, type = 'buy') {
        return amount * this.getFinalRate(type);
    }

    /**
     * تحويل مبلغ إلى العملة الأساسية
     * Convert amount to base currency
     */
    convertToBase(amount, type = 'sell') {
        return amount / this.getFinalRate(type);
    }

    /**
     * تحويل إلى كائن JSON
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            currencyId: this.currencyId,
            currencyCode: this.currencyCode,
            currencyName: this.currencyName,
            currencyNameEn: this.currencyNameEn,
            currencySymbol: this.currencySymbol,
            flagEmoji: this.flagEmoji,
            isBase: this.isBase,
            buyRate: this.buyRate,
            sellRate: this.sellRate,
            spread: this.spread,
            marginBuy: this.marginBuy,
            marginSell: this.marginSell,
            isManual: this.isManual,
            effectiveFrom: this.effectiveFrom,
            createdAt: this.createdAt
        };
    }

    // =====================================================
    // العمليات الثابتة (Static Methods)
    // =====================================================

    /**
     * البحث عن سعر بواسطة المعرف
     * Find rate by ID
     */
    static async findById(id) {
        try {
            const row = await db.get(
                `SELECT cr.*, c.code as currency_code, c.name_ar as currency_name,
                        c.name_en as currency_name_en, c.symbol as currency_symbol,
                        c.flag_emoji, c.is_base
                 FROM currency_rates cr
                 JOIN currencies c ON cr.currency_id = c.id
                 WHERE cr.id = ?`,
                [id]
            );
            
            return row ? new CurrencyRate(row) : null;
        } catch (error) {
            console.error('Error finding currency rate by ID:', error);
            throw error;
        }
    }

    /**
     * جلب السعر الحالي لعملة معينة
     * Get current rate for currency
     */
    static async getCurrentRate(currencyId) {
        try {
            const row = await db.get(
                `SELECT cr.*, c.code as currency_code, c.name_ar as currency_name,
                        c.name_en as currency_name_en, c.symbol as currency_symbol,
                        c.flag_emoji, c.is_base
                 FROM currency_rates cr
                 JOIN currencies c ON cr.currency_id = c.id
                 WHERE cr.currency_id = ?
                 AND cr.effective_from <= datetime('now')
                 AND (cr.effective_until IS NULL OR cr.effective_until > datetime('now'))
                 ORDER BY cr.effective_from DESC
                 LIMIT 1`,
                [currencyId]
            );
            
            return row ? new CurrencyRate(row) : null;
        } catch (error) {
            console.error('Error getting current currency rate:', error);
            throw error;
        }
    }

    /**
     * جلب السعر الحالي حسب كود العملة
     * Get current rate by currency code
     */
    static async getCurrentRateByCode(code) {
        try {
            const row = await db.get(
                `SELECT cr.*, c.code as currency_code, c.name_ar as currency_name,
                        c.name_en as currency_name_en, c.symbol as currency_symbol,
                        c.flag_emoji, c.is_base
                 FROM currency_rates cr
                 JOIN currencies c ON cr.currency_id = c.id
                 WHERE c.code = ?
                 AND cr.effective_from <= datetime('now')
                 AND (cr.effective_until IS NULL OR cr.effective_until > datetime('now'))
                 ORDER BY cr.effective_from DESC
                 LIMIT 1`,
                [code.toUpperCase()]
            );
            
            return row ? new CurrencyRate(row) : null;
        } catch (error) {
            console.error('Error getting current rate by code:', error);
            throw error;
        }
    }

    /**
     * جلب جميع الأسعار الحالية
     * Get all current rates
     */
    static async getAllCurrentRates() {
        try {
            const rows = await db.all(
                `SELECT cr.*, c.code as currency_code, c.name_ar as currency_name,
                        c.name_en as currency_name_en, c.symbol as currency_symbol,
                        c.flag_emoji, c.is_base
                 FROM currencies c
                 LEFT JOIN currency_rates cr ON c.id = cr.currency_id
                 AND cr.effective_from <= datetime('now')
                 AND (cr.effective_until IS NULL OR cr.effective_until > datetime('now'))
                 AND cr.id = (
                     SELECT id FROM currency_rates 
                     WHERE currency_id = c.id 
                     AND effective_from <= datetime('now')
                     AND (effective_until IS NULL OR effective_until > datetime('now'))
                     ORDER BY effective_from DESC 
                     LIMIT 1
                 )
                 WHERE c.is_active = 1
                 ORDER BY c.display_order, c.code`
            );
            
            return rows.map(row => new CurrencyRate(row));
        } catch (error) {
            console.error('Error getting all current currency rates:', error);
            throw error;
        }
    }

    /**
     * جلب جميع العملات
     * Get all currencies
     */
    static async getCurrencies() {
        try {
            const rows = await db.all(
                `SELECT * FROM currencies 
                 WHERE is_active = 1 
                 ORDER BY display_order, code`
            );
            
            return rows;
        } catch (error) {
            console.error('Error getting currencies:', error);
            throw error;
        }
    }

    /**
     * إنشاء سعر جديد
     * Create new rate
     */
    static async create(rateData, updatedBy = null) {
        try {
            // إنهاء الأسعار السابقة
            await db.run(
                `UPDATE currency_rates 
                 SET effective_until = datetime('now')
                 WHERE currency_id = ? 
                 AND effective_until IS NULL`,
                [rateData.currencyId]
            );

            // حساب الفرق
            const spread = rateData.sellRate - rateData.buyRate;

            // إدراج السعر الجديد
            const result = await db.run(
                `INSERT INTO currency_rates 
                 (currency_id, buy_rate, sell_rate, spread, margin_buy, margin_sell, 
                  is_manual, updated_by, effective_from)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                [
                    rateData.currencyId,
                    rateData.buyRate,
                    rateData.sellRate,
                    spread,
                    rateData.marginBuy || 0,
                    rateData.marginSell || 0,
                    rateData.isManual ? 1 : 0,
                    updatedBy
                ]
            );

            // تسجيل التغيير
            await CurrencyRate.logChange(result.id, 'CREATE', updatedBy, rateData);

            return await CurrencyRate.findById(result.id);
        } catch (error) {
            console.error('Error creating currency rate:', error);
            throw error;
        }
    }

    /**
     * تحديث سعر
     * Update rate
     */
    static async update(id, rateData, updatedBy = null) {
        try {
            const rate = await CurrencyRate.findById(id);
            if (!rate) {
                throw new Error('Currency rate not found');
            }

            // إذا كان السعر فعالاً، أنشئ سعراً جديداً بدلاً من التحديث
            if (!rate.effectiveUntil) {
                return await CurrencyRate.create({
                    currencyId: rate.currencyId,
                    buyRate: rateData.buyRate || rate.buyRate,
                    sellRate: rateData.sellRate || rate.sellRate,
                    marginBuy: rateData.marginBuy !== undefined ? rateData.marginBuy : rate.marginBuy,
                    marginSell: rateData.marginSell !== undefined ? rateData.marginSell : rate.marginSell,
                    isManual: rateData.isManual !== undefined ? rateData.isManual : rate.isManual
                }, updatedBy);
            }

            // تحديث السعر غير الفعال
            const spread = (rateData.sellRate || rate.sellRate) - 
                          (rateData.buyRate || rate.buyRate);

            await db.run(
                `UPDATE currency_rates 
                 SET buy_rate = ?, sell_rate = ?, spread = ?, 
                     margin_buy = ?, margin_sell = ?, is_manual = ?,
                     updated_by = ?
                 WHERE id = ?`,
                [
                    rateData.buyRate || rate.buyRate,
                    rateData.sellRate || rate.sellRate,
                    spread,
                    rateData.marginBuy !== undefined ? rateData.marginBuy : rate.marginBuy,
                    rateData.marginSell !== undefined ? rateData.marginSell : rate.marginSell,
                    rateData.isManual !== undefined ? (rateData.isManual ? 1 : 0) : (rate.isManual ? 1 : 0),
                    updatedBy,
                    id
                ]
            );

            // تسجيل التغيير
            await CurrencyRate.logChange(id, 'UPDATE', updatedBy, rateData);

            return await CurrencyRate.findById(id);
        } catch (error) {
            console.error('Error updating currency rate:', error);
            throw error;
        }
    }

    /**
     * حذف سعر
     * Delete rate
     */
    static async delete(id, deletedBy = null) {
        try {
            const rate = await CurrencyRate.findById(id);
            if (!rate) {
                throw new Error('Currency rate not found');
            }

            // تسجيل الحذف
            await CurrencyRate.logChange(id, 'DELETE', deletedBy, rate.toJSON());

            // حذف السعر
            await db.run('DELETE FROM currency_rates WHERE id = ?', [id]);

            return true;
        } catch (error) {
            console.error('Error deleting currency rate:', error);
            throw error;
        }
    }

    /**
     * جلب تاريخ الأسعار
     * Get rate history
     */
    static async getHistory(currencyId, options = {}) {
        try {
            let sql = `
                SELECT cr.*, c.code as currency_code, c.name_ar as currency_name,
                       c.name_en as currency_name_en, c.symbol as currency_symbol,
                       c.flag_emoji, c.is_base
                FROM currency_rates cr
                JOIN currencies c ON cr.currency_id = c.id
                WHERE cr.currency_id = ?
            `;
            const params = [currencyId];

            // تصفية حسب التاريخ
            if (options.startDate) {
                sql += ' AND cr.effective_from >= ?';
                params.push(options.startDate);
            }

            if (options.endDate) {
                sql += ' AND cr.effective_from <= ?';
                params.push(options.endDate);
            }

            sql += ' ORDER BY cr.effective_from DESC';

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
            return rows.map(row => new CurrencyRate(row));
        } catch (error) {
            console.error('Error getting currency rate history:', error);
            throw error;
        }
    }

    /**
     * تحويل عملة إلى أخرى
     * Convert between currencies
     */
    static async convert(amount, fromCode, toCode, type = 'buy') {
        try {
            // جلب أسعار العملات
            const fromRate = await CurrencyRate.getCurrentRateByCode(fromCode);
            const toRate = await CurrencyRate.getCurrentRateByCode(toCode);

            if (!fromRate || !toRate) {
                throw new Error('Currency rate not found');
            }

            // التحويل
            const baseAmount = fromRate.convertToBase(amount, type);
            const result = toRate.convertFromBase(baseAmount, type);

            return {
                amount,
                from: fromCode,
                to: toCode,
                result: Math.round(result * 10000) / 10000,
                rate: Math.round((toRate.getFinalRate(type) / fromRate.getFinalRate(type)) * 10000) / 10000
            };
        } catch (error) {
            console.error('Error converting currency:', error);
            throw error;
        }
    }

    /**
     * تسجيل التغييرات
     * Log changes
     */
    static async logChange(rateId, action, performedBy, details) {
        try {
            await db.run(
                `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, created_at)
                 VALUES (?, ?, 'CURRENCY_RATE', ?, ?, datetime('now'))`,
                [performedBy, action, rateId, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Error logging currency rate change:', error);
        }
    }

    /**
     * إحصائيات الأسعار
     * Get rate statistics
     */
    static async getStatistics(currencyId, days = 30) {
        try {
            const stats = await db.get(
                `SELECT 
                    MIN(buy_rate) as min_buy,
                    MAX(buy_rate) as max_buy,
                    AVG(buy_rate) as avg_buy,
                    MIN(sell_rate) as min_sell,
                    MAX(sell_rate) as max_sell,
                    AVG(sell_rate) as avg_sell,
                    COUNT(*) as total_records
                 FROM currency_rates
                 WHERE currency_id = ?
                 AND effective_from >= date('now', '-${days} days')`,
                [currencyId]
            );

            return {
                minBuy: stats.min_buy,
                maxBuy: stats.max_buy,
                avgBuy: Math.round(stats.avg_buy * 1000000) / 1000000,
                minSell: stats.min_sell,
                maxSell: stats.max_sell,
                avgSell: Math.round(stats.avg_sell * 1000000) / 1000000,
                totalRecords: stats.total_records
            };
        } catch (error) {
            console.error('Error getting currency rate statistics:', error);
            throw error;
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = CurrencyRate;