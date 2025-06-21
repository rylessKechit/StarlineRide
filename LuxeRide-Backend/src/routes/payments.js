const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    refundPayment,
    getPaymentHistory
} = require('../controllers/paymentController');
const { authenticateUser, authenticate } = require('../middleware/auth');

const router = express.Router();

// ================================
// VALIDATION MIDDLEWARE
// ================================
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Données invalides',
            errors: errors.array()
        });
    }
    next();
};

// ================================
// VALIDATIONS
// ================================

// Validation création Payment Intent
const createPaymentValidation = [
    body('bookingId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de réservation invalide'),
    body('paymentMethod')
        .optional()
        .isIn(['CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'CORPORATE'])
        .withMessage('Méthode de paiement invalide')
];

// Validation confirmation paiement
const confirmPaymentValidation = [
    body('paymentId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de paiement invalide'),
    body('paymentIntentId')
        .notEmpty()
        .matches(/^pi_/)
        .withMessage('Payment Intent ID invalide'),
    body('tip')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Pourboire invalide (max 100€)')
];

// Validation remboursement
const refundValidation = [
    body('paymentId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de paiement invalide'),
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Raison trop longue'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Montant de remboursement invalide')
];

// ================================
// ROUTES PUBLIQUES (WEBHOOKS)
// ================================

// @route   POST /api/payments/webhook
// @desc    Webhook Stripe pour les événements de paiement
// @access  Public (Stripe only)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ================================
// ROUTES CLIENTS
// ================================

// @route   POST /api/payments/create-intent
// @desc    Créer un Payment Intent pour une réservation
// @access  Private (Client)
router.post('/create-intent', authenticateUser, createPaymentValidation, validateRequest, createPaymentIntent);

// @route   POST /api/payments/confirm
// @desc    Confirmer un paiement
// @access  Private (Client)
router.post('/confirm', authenticateUser, confirmPaymentValidation, validateRequest, confirmPayment);

// @route   GET /api/payments/history
// @desc    Récupérer l'historique des paiements
// @access  Private (Client)
router.get('/history', authenticateUser, getPaymentHistory);

// ================================
// ROUTES REMBOURSEMENTS
// ================================

// @route   POST /api/payments/refund
// @desc    Effectuer un remboursement
// @access  Private (Client ou Admin)
router.post('/refund', authenticate, refundValidation, validateRequest, refundPayment);

// ================================
// ROUTES UTILITAIRES
// ================================

// @route   GET /api/payments/:paymentId
// @desc    Récupérer les détails d'un paiement
// @access  Private
router.get('/:paymentId', authenticate, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { paymentId } = req.params;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                booking: {
                    select: {
                        id: true,
                        pickupAddress: true,
                        dropoffAddress: true,
                        scheduledFor: true,
                        completedAt: true,
                        estimatedDistance: true,
                        finalPrice: true,
                        user: { select: { id: true } },
                        driver: { select: { id: true } }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Paiement non trouvé'
            });
        }

        // Vérifier les permissions
        const hasPermission = userType === 'admin' ||
                             (userType === 'user' && payment.booking.user.id === userId) ||
                             (userType === 'driver' && payment.booking.driver?.id === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        res.json({
            success: true,
            data: { payment }
        });

    } catch (error) {
        console.error('Error in getPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du paiement'
        });
    }
});

// @route   GET /api/payments/booking/:bookingId
// @desc    Récupérer le paiement d'une réservation
// @access  Private
router.get('/booking/:bookingId', authenticate, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { bookingId } = req.params;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Vérifier la réservation
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                userId: true,
                driverId: true
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Vérifier les permissions
        const hasPermission = userType === 'admin' ||
                             (userType === 'user' && booking.userId === userId) ||
                             (userType === 'driver' && booking.driverId === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const payment = await prisma.payment.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    select: {
                        pickupAddress: true,
                        dropoffAddress: true,
                        scheduledFor: true,
                        completedAt: true,
                        estimatedDistance: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: { payment }
        });

    } catch (error) {
        console.error('Error in getPaymentByBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du paiement'
        });
    }
});

// @route   POST /api/payments/calculate-price
// @desc    Calculer le prix d'une course avant paiement
// @access  Private
router.post('/calculate-price', authenticateUser, [
    body('bookingId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de réservation invalide')
], validateRequest, async (req, res) => {
    try {
        const { userId } = req.user;
        const { bookingId } = req.body;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: {
                        membershipTier: true
                    }
                }
            }
        });

        if (!booking || booking.userId !== userId) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Calculer le prix (même fonction que dans le controller)
        const calculateFinalPrice = (booking) => {
            const basePrice = parseFloat(booking.estimatedPrice) || 0;
            const distance = parseFloat(booking.estimatedDistance) || 0;
            const duration = parseInt(booking.estimatedDuration) || 0;
            
            const distancePrice = distance * 2.5;
            const timePrice = (duration / 60) * 15;
            
            let surcharge = 0;
            const hour = new Date(booking.scheduledFor).getHours();
            if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
                surcharge += basePrice * 0.3;
            }
            
            const day = new Date(booking.scheduledFor).getDay();
            if (day === 0 || day === 6) {
                surcharge += basePrice * 0.2;
            }
            
            let discount = 0;
            if (booking.user.membershipTier === 'GOLD') {
                discount = basePrice * 0.05;
            } else if (booking.user.membershipTier === 'PLATINUM') {
                discount = basePrice * 0.1;
            } else if (booking.user.membershipTier === 'VIP') {
                discount = basePrice * 0.15;
            }
            
            const total = Math.max(basePrice + surcharge - discount, 8);
            
            return {
                basePrice: Math.round(basePrice * 100) / 100,
                distancePrice: Math.round(distancePrice * 100) / 100,
                timePrice: Math.round(timePrice * 100) / 100,
                surcharge: Math.round(surcharge * 100) / 100,
                discount: Math.round(discount * 100) / 100,
                total: Math.round(total * 100) / 100
            };
        };

        const priceBreakdown = calculateFinalPrice(booking);

        res.json({
            success: true,
            data: {
                bookingId,
                priceBreakdown,
                membershipTier: booking.user.membershipTier
            }
        });

    } catch (error) {
        console.error('Error in calculatePrice:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul du prix'
        });
    }
});

// @route   GET /api/payments/stats
// @desc    Statistiques de paiements pour l'utilisateur
// @access  Private
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.user;
        const { period = 'month' } = req.query;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        let dateFilter;
        const now = new Date();

        switch (period) {
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                dateFilter = { gte: weekStart };
                break;
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { gte: monthStart };
                break;
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                dateFilter = { gte: yearStart };
                break;
            default:
                const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { gte: defaultStart };
        }

        const stats = await prisma.payment.aggregate({
            where: {
                userId,
                status: 'COMPLETED',
                paidAt: dateFilter
            },
            _count: { id: true },
            _sum: { amount: true, tip: true },
            _avg: { amount: true }
        });

        // Répartition par méthode de paiement
        const paymentMethods = await prisma.payment.groupBy({
            by: ['method'],
            where: {
                userId,
                status: 'COMPLETED',
                paidAt: dateFilter
            },
            _count: { id: true },
            _sum: { amount: true }
        });

        res.json({
            success: true,
            data: {
                period,
                summary: {
                    totalPayments: stats._count.id || 0,
                    totalAmount: stats._sum.amount || 0,
                    totalTips: stats._sum.tip || 0,
                    averageAmount: stats._avg.amount || 0
                },
                paymentMethods: paymentMethods.map(method => ({
                    method: method.method,
                    count: method._count.id,
                    total: method._sum.amount
                }))
            }
        });

    } catch (error) {
        console.error('Error in getPaymentStats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

module.exports = router;