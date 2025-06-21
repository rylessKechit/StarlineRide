const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    createBooking,
    acceptBooking,
    getUserBookings,
    getDriverBookings,
    updateBookingStatus
} = require('../controllers/bookingController');
const { authenticateUser, authenticateDriver, authenticate } = require('../middleware/auth');

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

// Validation création réservation
const createBookingValidation = [
    body('pickupAddress')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Adresse de départ invalide'),
    body('pickupLat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude de départ invalide'),
    body('pickupLng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude de départ invalide'),
    body('dropoffAddress')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Adresse de destination invalide'),
    body('dropoffLat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude de destination invalide'),
    body('dropoffLng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude de destination invalide'),
    body('scheduledFor')
        .isISO8601()
        .custom((value) => {
            const scheduledTime = new Date(value);
            const now = new Date();
            const maxFutureTime = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 jours
            
            if (scheduledTime < now) {
                throw new Error('La date ne peut pas être dans le passé');
            }
            if (scheduledTime > maxFutureTime) {
                throw new Error('La réservation ne peut pas être faite plus de 30 jours à l\'avance');
            }
            return true;
        }),
    body('vehicleCategory')
        .optional()
        .isIn(['BERLINE_EXECUTIVE', 'SUV_LUXE', 'VAN_PREMIUM', 'SUPERCAR', 'ELECTRIC_PREMIUM'])
        .withMessage('Catégorie de véhicule invalide'),
    body('passengerCount')
        .optional()
        .isInt({ min: 1, max: 8 })
        .withMessage('Nombre de passagers invalide'),
    body('specialRequests')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Demandes spéciales trop longues')
];

// Validation mise à jour statut
const updateStatusValidation = [
    body('status')
        .isIn([
            'PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 
            'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
        ])
        .withMessage('Statut invalide'),
    body('location.lat')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
    body('location.lng')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide')
];

// ================================
// ROUTES CLIENTS
// ================================

// @route   POST /api/bookings
// @desc    Créer une nouvelle réservation
// @access  Private (Client)
router.post('/', authenticateUser, createBookingValidation, validateRequest, createBooking);

// @route   GET /api/bookings/my-bookings
// @desc    Récupérer les réservations du client connecté
// @access  Private (Client)
router.get('/my-bookings', authenticateUser, getUserBookings);

// @route   PUT /api/bookings/:bookingId/status
// @desc    Mettre à jour le statut d'une réservation
// @access  Private (Client ou Chauffeur)
router.put('/:bookingId/status', authenticate, updateStatusValidation, validateRequest, updateBookingStatus);

// ================================
// ROUTES CHAUFFEURS
// ================================

// @route   POST /api/bookings/:bookingId/accept
// @desc    Accepter une réservation
// @access  Private (Chauffeur)
router.post('/:bookingId/accept', authenticateDriver, acceptBooking);

// @route   GET /api/bookings/driver/rides
// @desc    Récupérer les courses du chauffeur connecté
// @access  Private (Chauffeur)
router.get('/driver/rides', authenticateDriver, getDriverBookings);

// ================================
// ROUTES COMMUNES
// ================================

// @route   GET /api/bookings/:bookingId
// @desc    Récupérer les détails d'une réservation spécifique
// @access  Private
router.get('/:bookingId', authenticate, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { bookingId } = req.params;

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        membershipTier: true
                    }
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        rating: true,
                        currentLat: true,
                        currentLng: true
                    }
                },
                vehicle: {
                    select: {
                        brand: true,
                        model: true,
                        color: true,
                        licensePlate: true,
                        category: true,
                        features: true
                    }
                },
                payment: {
                    select: {
                        amount: true,
                        status: true,
                        method: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Vérifier les permissions
        const hasPermission = (userType === 'user' && booking.user.id === userId) ||
                             (userType === 'driver' && booking.driver?.id === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        res.json({
            success: true,
            data: { booking }
        });

    } catch (error) {
        console.error('Error in getBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la réservation'
        });
    }
});

// @route   POST /api/bookings/:bookingId/cancel
// @desc    Annuler une réservation
// @access  Private
router.post('/:bookingId/cancel', authenticate, async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { bookingId } = req.params;
        const { reason } = req.body;

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Vérifier la réservation
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { id: true } },
                driver: { select: { id: true } }
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        // Vérifier les permissions
        const hasPermission = (userType === 'user' && booking.user.id === userId) ||
                             (userType === 'driver' && booking.driver?.id === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // Vérifier que la réservation peut être annulée
        if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cette réservation ne peut plus être annulée'
            });
        }

        // Calculer les pénalités selon le timing et qui annule
        let cancellationFee = 0;
        const timeUntilRide = new Date(booking.scheduledFor) - new Date();
        const hoursUntilRide = timeUntilRide / (1000 * 60 * 60);

        if (userType === 'user' && hoursUntilRide < 1 && booking.status !== 'PENDING') {
            cancellationFee = parseFloat(booking.estimatedPrice) * 0.2; // 20% de pénalité
        }

        // Annuler la réservation
        const cancelledBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancellationReason: reason || `Annulé par ${userType === 'user' ? 'le client' : 'le chauffeur'}`
            }
        });

        // Remettre le chauffeur disponible si assigné
        if (booking.driver?.id) {
            await prisma.driver.update({
                where: { id: booking.driver.id },
                data: { status: 'AVAILABLE' }
            });
        }

        // Notifier l'autre partie
        const targetUserId = userType === 'driver' ? booking.user.id : booking.driver?.id;
        if (targetUserId) {
            req.app.get('io').to(`user_${targetUserId}`).emit('booking_cancelled', {
                bookingId,
                reason: cancelledBooking.cancellationReason,
                cancelledBy: userType,
                cancellationFee
            });
        }

        require('../utils/logger').info(`Booking ${bookingId} cancelled by ${userType} ${userId}`);

        res.json({
            success: true,
            message: 'Réservation annulée avec succès',
            data: {
                booking: cancelledBooking,
                cancellationFee
            }
        });

    } catch (error) {
        console.error('Error in cancelBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'annulation'
        });
    }
});

module.exports = router;