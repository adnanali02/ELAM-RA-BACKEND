/**
 * =====================================================
 * متحكم أسعار الذهب
 * Gold Prices Controller
 * =====================================================
 * الملف: backend/controllers/goldController.js
 * الغرض: التحكم في عمليات أسعار الذهب
 * =====================================================
 */

const GoldPrice = require('../models/GoldPrice');

// =====================================================
// فئة متحكم الذهب
// Gold Controller Class
// =====================================================
class GoldController {
    /**
     * جلب جميع أسعار الذهب الحالية
     * Get all current gold prices
     */
    static async getAllPrices(req, res) {
        try {
            const prices = await GoldPrice.getAllCurrentPrices();

            return res.status(200).json({
                success: true,
                data: prices.map(price => price.toJSON()),
                count: prices.length
            });
        } catch (error) {
            console.error('Get all gold prices error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve gold prices',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب سعر الذهب حسب المعرف
     * Get gold price by ID
     */
    static async getPriceById(req, res) {
        try {
            const { id } = req.params;
            const price = await GoldPrice.findById(id);

            if (!price) {
                return res.status(404).json({
                    success: false,
                    message: 'Gold price not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: price.toJSON()
            });
        } catch (error) {
            console.error('Get gold price by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve gold price',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب السعر الحالي لنوع ذهب معين
     * Get current price for gold type
     */
    static async getCurrentPrice(req, res) {
        try {
            const { goldTypeId } = req.params;
            const price = await GoldPrice.getCurrentPrice(goldTypeId);

            if (!price) {
                return res.status(404).json({
                    success: false,
                    message: 'No current price found for this gold type',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: price.toJSON()
            });
        } catch (error) {
            console.error('Get current gold price error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve current gold price',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب جميع أنواع الذهب
     * Get all gold types
     */
    static async getGoldTypes(req, res) {
        try {
            const types = await GoldPrice.getGoldTypes();

            return res.status(200).json({
                success: true,
                data: types,
                count: types.length
            });
        } catch (error) {
            console.error('Get gold types error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve gold types',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * إنشاء سعر ذهب جديد
     * Create new gold price
     */
    static async createPrice(req, res) {
        try {
            const { goldTypeId, buyPrice, sellPrice, marginBuy, marginSell, isManual } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من المدخلات
            if (!goldTypeId || buyPrice === undefined || sellPrice === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Gold type ID, buy price, and sell price are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // التحقق من صحة الأسعار
            if (isNaN(buyPrice) || isNaN(sellPrice) || buyPrice <= 0 || sellPrice <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Prices must be positive numbers',
                    code: 'INVALID_PRICES'
                });
            }

            // إنشاء السعر
            const price = await GoldPrice.create({
                goldTypeId,
                buyPrice: parseFloat(buyPrice),
                sellPrice: parseFloat(sellPrice),
                marginBuy: marginBuy !== undefined ? parseFloat(marginBuy) : 0,
                marginSell: marginSell !== undefined ? parseFloat(marginSell) : 0,
                isManual: isManual === true
            }, updatedBy);

            return res.status(201).json({
                success: true,
                message: 'Gold price created successfully',
                data: price.toJSON()
            });
        } catch (error) {
            console.error('Create gold price error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create gold price',
                code: 'CREATE_ERROR'
            });
        }
    }

    /**
     * تحديث سعر ذهب
     * Update gold price
     */
    static async updatePrice(req, res) {
        try {
            const { id } = req.params;
            const { buyPrice, sellPrice, marginBuy, marginSell, isManual } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من وجود السعر
            const existingPrice = await GoldPrice.findById(id);
            if (!existingPrice) {
                return res.status(404).json({
                    success: false,
                    message: 'Gold price not found',
                    code: 'NOT_FOUND'
                });
            }

            // إعداد بيانات التحديث
            const updateData = {};
            if (buyPrice !== undefined) updateData.buyPrice = parseFloat(buyPrice);
            if (sellPrice !== undefined) updateData.sellPrice = parseFloat(sellPrice);
            if (marginBuy !== undefined) updateData.marginBuy = parseFloat(marginBuy);
            if (marginSell !== undefined) updateData.marginSell = parseFloat(marginSell);
            if (isManual !== undefined) updateData.isManual = isManual === true;

            // تحديث السعر
            const price = await GoldPrice.update(id, updateData, updatedBy);

            return res.status(200).json({
                success: true,
                message: 'Gold price updated successfully',
                data: price.toJSON()
            });
        } catch (error) {
            console.error('Update gold price error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update gold price',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * حذف سعر ذهب
     * Delete gold price
     */
    static async deletePrice(req, res) {
        try {
            const { id } = req.params;
            const deletedBy = req.session?.userId;

            // التحقق من وجود السعر
            const existingPrice = await GoldPrice.findById(id);
            if (!existingPrice) {
                return res.status(404).json({
                    success: false,
                    message: 'Gold price not found',
                    code: 'NOT_FOUND'
                });
            }

            // حذف السعر
            await GoldPrice.delete(id, deletedBy);

            return res.status(200).json({
                success: true,
                message: 'Gold price deleted successfully'
            });
        } catch (error) {
            console.error('Delete gold price error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete gold price',
                code: 'DELETE_ERROR'
            });
        }
    }

    /**
     * جلب تاريخ أسعار الذهب
     * Get gold price history
     */
    static async getPriceHistory(req, res) {
        try {
            const { goldTypeId } = req.params;
            const { startDate, endDate, limit, offset } = req.query;

            const options = {};
            if (startDate) options.startDate = startDate;
            if (endDate) options.endDate = endDate;
            if (limit) options.limit = parseInt(limit, 10);
            if (offset) options.offset = parseInt(offset, 10);

            const history = await GoldPrice.getHistory(goldTypeId, options);

            return res.status(200).json({
                success: true,
                data: history.map(price => price.toJSON()),
                count: history.length
            });
        } catch (error) {
            console.error('Get gold price history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve price history',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث الأسعار تلقائياً
     * Auto update prices
     */
    static async autoUpdatePrices(req, res) {
        try {
            const { basePrice24k } = req.body;
            const updatedBy = req.session?.userId;

            if (!basePrice24k || isNaN(basePrice24k) || basePrice24k <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid base price for 24K gold is required',
                    code: 'INVALID_BASE_PRICE'
                });
            }

            const updatedPrices = await GoldPrice.autoUpdate(
                parseFloat(basePrice24k),
                updatedBy
            );

            return res.status(200).json({
                success: true,
                message: 'Gold prices updated automatically',
                data: updatedPrices.map(price => price.toJSON()),
                count: updatedPrices.length
            });
        } catch (error) {
            console.error('Auto update gold prices error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to auto update gold prices',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * جلب إحصائيات أسعار الذهب
     * Get gold price statistics
     */
    static async getStatistics(req, res) {
        try {
            const { goldTypeId } = req.params;
            const { days } = req.query;

            const daysCount = days ? parseInt(days, 10) : 30;
            const stats = await GoldPrice.getStatistics(goldTypeId, daysCount);

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get gold price statistics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve price statistics',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * مقارنة الأسعار
     * Compare prices
     */
    static async comparePrices(req, res) {
        try {
            const prices = await GoldPrice.getAllCurrentPrices();
            
            const comparison = prices.map(price => ({
                type: price.goldTypeName,
                karat: price.karat,
                buyPrice: price.buyPrice,
                sellPrice: price.sellPrice,
                spread: price.spread,
                spreadPercentage: ((price.spread / price.buyPrice) * 100).toFixed(2)
            }));

            return res.status(200).json({
                success: true,
                data: comparison
            });
        } catch (error) {
            console.error('Compare prices error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to compare prices',
                code: 'FETCH_ERROR'
            });
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = GoldController;