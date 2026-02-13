/**
 * =====================================================
 * متحكم أسعار العملات
 * Currency Rates Controller
 * =====================================================
 * الملف: backend/controllers/currencyController.js
 * الغرض: التحكم في عمليات أسعار العملات
 * =====================================================
 */

const CurrencyRate = require('../models/CurrencyRate');

// =====================================================
// فئة متحكم العملات
// Currency Controller Class
// =====================================================
class CurrencyController {
    /**
     * جلب جميع أسعار العملات الحالية
     * Get all current currency rates
     */
    static async getAllRates(req, res) {
        try {
            const rates = await CurrencyRate.getAllCurrentRates();

            return res.status(200).json({
                success: true,
                data: rates.map(rate => rate.toJSON()),
                count: rates.length
            });
        } catch (error) {
            console.error('Get all currency rates error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve currency rates',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب سعر العملة حسب المعرف
     * Get currency rate by ID
     */
    static async getRateById(req, res) {
        try {
            const { id } = req.params;
            const rate = await CurrencyRate.findById(id);

            if (!rate) {
                return res.status(404).json({
                    success: false,
                    message: 'Currency rate not found',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: rate.toJSON()
            });
        } catch (error) {
            console.error('Get currency rate by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve currency rate',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب السعر الحالي لعملة معينة
     * Get current rate for currency
     */
    static async getCurrentRate(req, res) {
        try {
            const { currencyId } = req.params;
            const rate = await CurrencyRate.getCurrentRate(currencyId);

            if (!rate) {
                return res.status(404).json({
                    success: false,
                    message: 'No current rate found for this currency',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: rate.toJSON()
            });
        } catch (error) {
            console.error('Get current currency rate error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve current currency rate',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب السعر الحالي حسب كود العملة
     * Get current rate by currency code
     */
    static async getRateByCode(req, res) {
        try {
            const { code } = req.params;
            const rate = await CurrencyRate.getCurrentRateByCode(code);

            if (!rate) {
                return res.status(404).json({
                    success: false,
                    message: 'No current rate found for this currency code',
                    code: 'NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                data: rate.toJSON()
            });
        } catch (error) {
            console.error('Get rate by code error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve currency rate',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * جلب جميع العملات
     * Get all currencies
     */
    static async getCurrencies(req, res) {
        try {
            const currencies = await CurrencyRate.getCurrencies();

            return res.status(200).json({
                success: true,
                data: currencies,
                count: currencies.length
            });
        } catch (error) {
            console.error('Get currencies error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve currencies',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * إنشاء سعر عملة جديد
     * Create new currency rate
     */
    static async createRate(req, res) {
        try {
            const { currencyId, buyRate, sellRate, marginBuy, marginSell, isManual } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من المدخلات
            if (!currencyId || buyRate === undefined || sellRate === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Currency ID, buy rate, and sell rate are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // التحقق من صحة الأسعار
            if (isNaN(buyRate) || isNaN(sellRate) || buyRate <= 0 || sellRate <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rates must be positive numbers',
                    code: 'INVALID_RATES'
                });
            }

            // إنشاء السعر
            const rate = await CurrencyRate.create({
                currencyId,
                buyRate: parseFloat(buyRate),
                sellRate: parseFloat(sellRate),
                marginBuy: marginBuy !== undefined ? parseFloat(marginBuy) : 0,
                marginSell: marginSell !== undefined ? parseFloat(marginSell) : 0,
                isManual: isManual === true
            }, updatedBy);

            return res.status(201).json({
                success: true,
                message: 'Currency rate created successfully',
                data: rate.toJSON()
            });
        } catch (error) {
            console.error('Create currency rate error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create currency rate',
                code: 'CREATE_ERROR'
            });
        }
    }

    /**
     * تحديث سعر عملة
     * Update currency rate
     */
    static async updateRate(req, res) {
        try {
            const { id } = req.params;
            const { buyRate, sellRate, marginBuy, marginSell, isManual } = req.body;
            const updatedBy = req.session?.userId;

            // التحقق من وجود السعر
            const existingRate = await CurrencyRate.findById(id);
            if (!existingRate) {
                return res.status(404).json({
                    success: false,
                    message: 'Currency rate not found',
                    code: 'NOT_FOUND'
                });
            }

            // إعداد بيانات التحديث
            const updateData = {};
            if (buyRate !== undefined) updateData.buyRate = parseFloat(buyRate);
            if (sellRate !== undefined) updateData.sellRate = parseFloat(sellRate);
            if (marginBuy !== undefined) updateData.marginBuy = parseFloat(marginBuy);
            if (marginSell !== undefined) updateData.marginSell = parseFloat(marginSell);
            if (isManual !== undefined) updateData.isManual = isManual === true;

            // تحديث السعر
            const rate = await CurrencyRate.update(id, updateData, updatedBy);

            return res.status(200).json({
                success: true,
                message: 'Currency rate updated successfully',
                data: rate.toJSON()
            });
        } catch (error) {
            console.error('Update currency rate error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update currency rate',
                code: 'UPDATE_ERROR'
            });
        }
    }

    /**
     * حذف سعر عملة
     * Delete currency rate
     */
    static async deleteRate(req, res) {
        try {
            const { id } = req.params;
            const deletedBy = req.session?.userId;

            // التحقق من وجود السعر
            const existingRate = await CurrencyRate.findById(id);
            if (!existingRate) {
                return res.status(404).json({
                    success: false,
                    message: 'Currency rate not found',
                    code: 'NOT_FOUND'
                });
            }

            // حذف السعر
            await CurrencyRate.delete(id, deletedBy);

            return res.status(200).json({
                success: true,
                message: 'Currency rate deleted successfully'
            });
        } catch (error) {
            console.error('Delete currency rate error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete currency rate',
                code: 'DELETE_ERROR'
            });
        }
    }

    /**
     * جلب تاريخ أسعار العملة
     * Get currency rate history
     */
    static async getRateHistory(req, res) {
        try {
            const { currencyId } = req.params;
            const { startDate, endDate, limit, offset } = req.query;

            const options = {};
            if (startDate) options.startDate = startDate;
            if (endDate) options.endDate = endDate;
            if (limit) options.limit = parseInt(limit, 10);
            if (offset) options.offset = parseInt(offset, 10);

            const history = await CurrencyRate.getHistory(currencyId, options);

            return res.status(200).json({
                success: true,
                data: history.map(rate => rate.toJSON()),
                count: history.length
            });
        } catch (error) {
            console.error('Get currency rate history error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve rate history',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحويل العملات
     * Convert currencies
     */
    static async convert(req, res) {
        try {
            const { amount, from, to, type } = req.body;

            // التحقق من المدخلات
            if (!amount || !from || !to) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount, from currency, and to currency are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // التحقق من صحة المبلغ
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number',
                    code: 'INVALID_AMOUNT'
                });
            }

            // تحويل العملة
            const result = await CurrencyRate.convert(
                parseFloat(amount),
                from.toUpperCase(),
                to.toUpperCase(),
                type || 'buy'
            );

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Currency conversion error:', error);
            return res.status(500).json({
                success: false,
                message: 'Currency conversion failed',
                code: 'CONVERSION_ERROR'
            });
        }
    }

    /**
     * جلب إحصائيات أسعار العملة
     * Get currency rate statistics
     */
    static async getStatistics(req, res) {
        try {
            const { currencyId } = req.params;
            const { days } = req.query;

            const daysCount = days ? parseInt(days, 10) : 30;
            const stats = await CurrencyRate.getStatistics(currencyId, daysCount);

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get currency rate statistics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve rate statistics',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * مقارنة أسعار العملات
     * Compare currency rates
     */
    static async compareRates(req, res) {
        try {
            const rates = await CurrencyRate.getAllCurrentRates();
            
            const comparison = rates.map(rate => ({
                code: rate.currencyCode,
                name: rate.currencyName,
                flag: rate.flagEmoji,
                buyRate: rate.buyRate,
                sellRate: rate.sellRate,
                spread: rate.spread,
                spreadPercentage: ((rate.spread / rate.buyRate) * 100).toFixed(4)
            }));

            return res.status(200).json({
                success: true,
                data: comparison
            });
        } catch (error) {
            console.error('Compare rates error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to compare rates',
                code: 'FETCH_ERROR'
            });
        }
    }

    /**
     * تحديث جميع أسعار العملات
     * Update all currency rates
     */
    static async bulkUpdate(req, res) {
        try {
            const { rates } = req.body;
            const updatedBy = req.session?.userId;

            if (!Array.isArray(rates) || rates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rates array is required',
                    code: 'MISSING_RATES'
                });
            }

            const updatedRates = [];
            const errors = [];

            for (const rateData of rates) {
                try {
                    const { currencyId, buyRate, sellRate } = rateData;
                    
                    if (!currencyId || buyRate === undefined || sellRate === undefined) {
                        errors.push({ currencyId, error: 'Missing required fields' });
                        continue;
                    }

                    const rate = await CurrencyRate.create({
                        currencyId,
                        buyRate: parseFloat(buyRate),
                        sellRate: parseFloat(sellRate),
                        marginBuy: rateData.marginBuy || 0,
                        marginSell: rateData.marginSell || 0,
                        isManual: rateData.isManual || false
                    }, updatedBy);

                    updatedRates.push(rate.toJSON());
                } catch (error) {
                    errors.push({ 
                        currencyId: rateData.currencyId, 
                        error: error.message 
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Bulk update completed',
                data: {
                    updated: updatedRates,
                    errors: errors,
                    totalProcessed: rates.length,
                    successCount: updatedRates.length,
                    errorCount: errors.length
                }
            });
        } catch (error) {
            console.error('Bulk update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Bulk update failed',
                code: 'BULK_UPDATE_ERROR'
            });
        }
    }
}

// =====================================================
// تصدير الفئة
// Export class
// =====================================================
module.exports = CurrencyController;