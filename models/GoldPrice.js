/**
 * =====================================================
 * نموذج أسعار الذهب
 * Gold Price Model
 * =====================================================
 * الملف: backend/models/GoldPrice.js
 * الغرض: إدارة أسعار الذهب والعمليات عليها
 * =====================================================
 */

const db = require('../config/database');

// =====================================================
// فئة أسعار الذهب
// Gold Price Class
// =====================================================
class GoldPrice {
    /**
     * إنشاء كائن سعر الذهب
     * Create gold price object
     */
    constructor(data = {}) {
        this.id = data.id || null;
        this.goldTypeId = data.gold_type_id || null;
        this.buyPrice = data.buy_price || 0;
        this.sellPrice = data.sell_price || 0;
        this.spread = data.spread || 0;
        this.marginBuy = data.margin_buy || 0;
        this.marginSell = data.margin_sell || 0;
        this.isManual = data.is_manual || false;
        this.updatedBy = data.updated_by || null;
        this.effectiveFrom = data.effective_from || null;
        this.effectiveUntil = data.effective_until || null;
        this.createdAt = data.created_at || null;
        
        // معلومات إضافية من الانضمام
        this.goldTypeName = data.gold_type_name || null;
        this.goldTypeNameEn = data.gold_type_name_en || null;
        this.karat = data.karat || null;
        this.purity = data.purity || null;
    }

    /**
     * حساب الفرق (Spread)
     * Calculate spread
     */
    calculateSpread() {
        return this.sellPrice - this.buyPrice;
    }

    /**
     * حساب الهامش
     * Calculate margin
     */
    calculateMargin(type = 'buy') {
        const price = type === 'buy' ? this.buyPrice : this.sellPrice;
        const margin = type === 'buy' ? this.marginBuy : this.marginSell;
        return price * margin;
    }

    /**
     * الحصول على السعر النهائي
     * Get final price
     */
    getFinalPrice(type = 'buy') {
        const price = type === 'buy' ? this.buyPrice : this.sellPrice;
        const margin = this.calculateMargin(type);
        return type === 'buy' ? price + margin : price - margin;
    }

    /**
     * تحويل إلى كائن JSON
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            goldTypeId: this.goldTypeId,
            goldTypeName: this.goldTypeName,
            goldTypeNameEn: this.goldTypeNameEn,
            karat: this.karat,
            purity: this.purity,
            buyPrice: this.buyPrice,
            sellPrice: this.sellPrice,
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
     * Find price by ID
     */
    static async findById(id) {
        try {
            const row = await db.get(
                `SELECT gp.*, gt.name_ar as gold_type_name, gt.name_en as gold_type_name_en,
                        gt.karat, gt.purity
                 FROM gold_prices gp
                 JOIN gold_types gt ON gp.gold_type_id = gt.id
                 WHERE gp.id = ?`,
                [id]
            );
            
            return row ? new GoldPrice(row) : null;
        } catch (error) {
            console.error('Error finding gold price by ID:', error);
            throw error;
        }
    }

    /**
     * جلب السعر الحالي لنوع ذهب معين
     * Get current price for gold type
     */
    static async getCurrentPrice(goldTypeId) {
        try {
            const row = await db.get(
                `SELECT gp.*, gt.name_ar as gold_type_name, gt.name_en as gold_type_name_en,
                        gt.karat, gt.purity
                 FROM gold_prices gp
                 JOIN gold_types gt ON gp.gold_type_id = gt.id
                 WHERE gp.gold_type_id = ?
                 AND gp.effective_from <= datetime('now')
                 AND (gp.effective_until IS NULL OR gp.effective_until > datetime('now'))
                 ORDER BY gp.effective_from DESC
                 LIMIT 1`,
                [goldTypeId]
            );
            
            return row ? new GoldPrice(row) : null;
        } catch (error) {
            console.error('Error getting current gold price:', error);
            throw error;
        }
    }

    /**
     * جلب جميع الأسعار الحالية
     * Get all current prices
     */
    static async getAllCurrentPrices() {
        try {
            const rows = await db.all(
                `SELECT gp.*, gt.name_ar as gold_type_name, gt.name_en as gold_type_name_en,
                        gt.karat, gt.purity
                 FROM gold_types gt
                 LEFT JOIN gold_prices gp ON gt.id = gp.gold_type_id
                 AND gp.effective_from <= datetime('now')
                 AND (gp.effective_until IS NULL OR gp.effective_until > datetime('now'))
                 AND gp.id = (
                     SELECT id FROM gold_prices 
                     WHERE gold_type_id = gt.id 
                     AND effective_from <= datetime('now')
                     AND (effective_until IS NULL OR effective_until > datetime('now'))
                     ORDER BY effective_from DESC 
                     LIMIT 1
                 )
                 WHERE gt.is_active = 1
                 ORDER BY gt.display_order, gt.karat DESC`
            );
            
            return rows.map(row => new GoldPrice(row));
        } catch (error) {
            console.error('Error getting all current gold prices:', error);
            throw error;
        }
    }

    /**
     * جلب جميع أنواع الذهب
     * Get all gold types
     */
    static async getGoldTypes() {
        try {
            const rows = await db.all(
                `SELECT * FROM gold_types 
                 WHERE is_active = 1 
                 ORDER BY display_order, karat DESC`
            );
            
            return rows;
        } catch (error) {
            console.error('Error getting gold types:', error);
            throw error;
        }
    }

    /**
     * إنشاء سعر جديد
     * Create new price
     */
    static async create(priceData, updatedBy = null) {
        try {
            // إنهاء الأسعار السابقة
            await db.run(
                `UPDATE gold_prices 
                 SET effective_until = datetime('now')
                 WHERE gold_type_id = ? 
                 AND effective_until IS NULL`,
                [priceData.goldTypeId]
            );

            // حساب الفرق
            const spread = priceData.sellPrice - priceData.buyPrice;

            // إدراج السعر الجديد
            const result = await db.run(
                `INSERT INTO gold_prices 
                 (gold_type_id, buy_price, sell_price, spread, margin_buy, margin_sell, 
                  is_manual, updated_by, effective_from)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                [
                    priceData.goldTypeId,
                    priceData.buyPrice,
                    priceData.sellPrice,
                    spread,
                    priceData.marginBuy || 0,
                    priceData.marginSell || 0,
                    priceData.isManual ? 1 : 0,
                    updatedBy
                ]
            );

            // تسجيل التغيير
            await GoldPrice.logChange(result.id, 'CREATE', updatedBy, priceData);

            return await GoldPrice.findById(result.id);
        } catch (error) {
            console.error('Error creating gold price:', error);
            throw error;
        }
    }

    /**
     * تحديث سعر
     * Update price
     */
    static async update(id, priceData, updatedBy = null) {
        try {
            const price = await GoldPrice.findById(id);
            if (!price) {
                throw new Error('Gold price not found');
            }

            // إذا كان السعر فعالاً، أنشئ سعراً جديداً بدلاً من التحديث
            if (!price.effectiveUntil) {
                return await GoldPrice.create({
                    goldTypeId: price.goldTypeId,
                    buyPrice: priceData.buyPrice || price.buyPrice,
                    sellPrice: priceData.sellPrice || price.sellPrice,
                    marginBuy: priceData.marginBuy !== undefined ? priceData.marginBuy : price.marginBuy,
                    marginSell: priceData.marginSell !== undefined ? priceData.marginSell : price.marginSell,
                    isManual: priceData.isManual !== undefined ? priceData.isManual : price.isManual
                }, updatedBy);
            }

            // تحديث السعر غير الفعال
            const spread = (priceData.sellPrice || price.sellPrice) - 
                          (priceData.buyPrice || price.buyPrice);

            await db.run(
                `UPDATE gold_prices 
                 SET buy_price = ?, sell_price = ?, spread = ?, 
                     margin_buy = ?, margin_sell = ?, is_manual = ?,
                     updated_by = ?
                 WHERE id = ?`,
                [
                    priceData.buyPrice || price.buyPrice,
                    priceData.sellPrice || price.sellPrice,
                    spread,
                    priceData.marginBuy !== undefined ? priceData.marginBuy : price.marginBuy,
                    priceData.marginSell !== undefined ? priceData.marginSell : price.marginSell,
                    priceData.isManual !== undefined ? (priceData.isManual ? 1 : 0) : (price.isManual ? 1 : 0),
                    updatedBy,
                    id
                ]
            );

            // تسجيل التغيير
            await GoldPrice.logChange(id, 'UPDATE', updatedBy, priceData);

            return await GoldPrice.findById(id);
        } catch (error) {
            console.error('Error updating gold price:', error);
            throw error;
        }
    }

    /**
     * حذف سعر
     * Delete price
     */
    static async delete(id, deletedBy = null) {
        try {
            const price = await GoldPrice.findById(id);
            if (!price) {
                throw new Error('Gold price not found');
            }

            // تسجيل الحذف
            await GoldPrice.logChange(id, 'DELETE', deletedBy, price.toJSON());

            // حذف السعر
            await db.run('DELETE FROM gold_prices WHERE id = ?', [id]);

            return true;
        } catch (error) {
            console.error('Error deleting gold price:', error);
            throw error;
        }
    }

    /**
     * جلب تاريخ الأسعار
     * Get price history
     */
    static async getHistory(goldTypeId, options = {}) {
        try {
            let sql = `
                SELECT gp.*, gt.name_ar as gold_type_name, gt.name_en as gold_type_name_en,
                       gt.karat, gt.purity
                FROM gold_prices gp
                JOIN gold_types gt ON gp.gold_type_id = gt.id
                WHERE gp.gold_type_id = ?
            `;
            const params = [goldTypeId];

            // تصفية حسب التاريخ
            if (options.startDate) {
                sql += ' AND gp.effective_from >= ?';
                params.push(options.startDate);
            }

            if (options.endDate) {
                sql += ' AND gp.effective_from <= ?';
                params.push(options.endDate);
            }

            sql += ' ORDER BY gp.effective_from DESC';

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
            return rows.map(row => new GoldPrice(row));
        } catch (error) {
            console.error('Error getting gold price history:', error);
            throw error;
        }
    }

    /**
     * تحديث الأسعار تلقائياً
     * Auto update prices
     */
    static async autoUpdate(basePrice24k, updatedBy = null) {
        try {
            const goldTypes = await GoldPrice.getGoldTypes();
            const updatedPrices = [];

            for (const goldType of goldTypes) {
                // حساب السعر بناءً على العيار
                const purity = goldType.purity;
                const basePrice = basePrice24k * purity;
                
                // إضافة هوامش افتراضية
                const marginBuy = 0.02;
                const marginSell = 0.02;
                
                const buyPrice = basePrice * (1 - marginBuy);
                const sellPrice = basePrice * (1 + marginSell);

                const price = await GoldPrice.create({
                    goldTypeId: goldType.id,
                    buyPrice: Math.round(buyPrice * 100) / 100,
                    sellPrice: Math.round(sellPrice * 100) / 100,
                    marginBuy,
                    marginSell,
                    isManual: false
                }, updatedBy);

                updatedPrices.push(price);
            }

            return updatedPrices;
        } catch (error) {
            console.error('Error auto updating gold prices:', error);
            throw error;
        }
    }

    /**
     * تسجيل التغييرات
     * Log changes
     */
    static async logChange(priceId, action, performedBy, details) {
        try {
            await db.run(
                `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, created_at)
                 VALUES (?, ?, 'GOLD_PRICE', ?, ?, datetime('now'))`,
                [performedBy, action, priceId, JSON.stringify(details)]
            );
        } catch (error) {
            console.error('Error logging gold price change:', error);
        }
    }

    /**
     * إحصائيات الأسعار
     * Get price statistics
     */
    static async getStatistics(goldTypeId, days = 30) {
        try {
            const stats = await db.get(
                `SELECT 
                    MIN(buy_price) as min_buy,
                    MAX(buy_price) as max_buy,
                    AVG(buy_price) as avg_buy,
                    MIN(sell_price) as min_sell,
                    MAX(sell_price) as max_sell,
                    AVG(sell_price) as avg_sell,
                    COUNT(*) as total_records
                 FROM gold_prices
                 WHERE gold_type_id = ?
                 AND effective_from >= date('now', '-${days} days')`,
                [goldTypeId]
            );

            return {
                minBuy: stats.min_buy,
                maxBuy: stats.max_buy,
                avgBuy: Math.round(stats.avg_buy * 100) / 100,
                minSell: stats.min_sell,
                maxSell: stats.max_sell,
                avgSell: Math.round(stats.avg_sell * 100) / 100,
                totalRecords: stats.total_records
            };
        } catch (error) {
            console.error('Error getting gold price statistics:', error);
            throw error;
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = GoldPrice;