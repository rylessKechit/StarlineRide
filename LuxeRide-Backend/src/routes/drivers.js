const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const {
    updateDriverStatus,
    updateLocation,
    getDriverStats,
    getDriverEarnings,
    addVehicle,
    getDriverVehicles,
    toggleVehicleStatus,
    getActiveRide,
    uploadDocument,
    getDriverDocuments
} = require('../controllers/driverController');
const { authenticateDriver } = require('../middleware/auth');

const router = express.Router();

// ================================
// CONFIGURATION MULTER POUR UPLOAD
// ================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/documents/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

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

// Validation mise à jour statut
const statusUpdateValidation = [
    body('status')
        .optional()
        .isIn(['OFFLINE', 'AVAILABLE', 'BUSY', 'BREAK'])
        .withMessage('Statut invalide'),
    body('isOnline')
        .optional()
        .isBoolean()
        .withMessage('État en ligne invalide'),
    body('location.lat')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
    body('location.lng')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide')
];

// Validation position
const locationUpdateValidation = [
    body('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
    body('lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide'),
    body('heading')
        .optional()
        .isFloat({ min: 0, max: 360 })
        .withMessage('Cap invalide'),
    body('speed')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Vitesse invalide')
];

// Validation véhicule
const vehicleValidation = [
    body('brand')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Marque invalide'),
    body('model')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Modèle invalide'),
    body('year')
        .isInt({ min: 2010, max: new Date().getFullYear() + 1 })
        .withMessage('Année invalide'),
    body('color')
        .trim()
        .isLength({ min: 2, max: 30 })
        .withMessage('Couleur invalide'),
    body('licensePlate')
        .trim()
        .isLength({ min: 6, max: 10 })
        .matches(/^[A-Z0-9-]+$/)
        .withMessage('Plaque d\'immatriculation invalide'),
    body('category')
        .isIn(['BERLINE_EXECUTIVE', 'SUV_LUXE', 'VAN_PREMIUM', 'SUPERCAR', 'ELECTRIC_PREMIUM'])
        .withMessage('Catégorie invalide'),
    body('maxPassengers')
        .isInt({ min: 1, max: 8 })
        .withMessage('Nombre de passagers invalide'),
    body('features')
        .optional()
        .isArray()
        .withMessage('Équipements invalides'),
    body('hasWifi')
        .optional()
        .isBoolean()
        .withMessage('WiFi invalide'),
    body('hasChargers')
        .optional()
        .isBoolean()
        .withMessage('Chargeurs invalides'),
    body('hasAC')
        .optional()
        .isBoolean()
        .withMessage('Climatisation invalide')
];

// ================================
// ROUTES STATUT & POSITION
// ================================

// @route   PUT /api/drivers/status
// @desc    Mettre à jour le statut du chauffeur
// @access  Private (Driver)
router.put('/status', authenticateDriver, statusUpdateValidation, validateRequest, updateDriverStatus);

// @route   PUT /api/drivers/location
// @desc    Mettre à jour la position du chauffeur
// @access  Private (Driver)
router.put('/location', authenticateDriver, locationUpdateValidation, validateRequest, updateLocation);

// ================================
// ROUTES STATISTIQUES
// ================================

// @route   GET /api/drivers/stats
// @desc    Récupérer les statistiques du chauffeur
// @access  Private (Driver)
router.get('/stats', authenticateDriver, getDriverStats);

// @route   GET /api/drivers/earnings
// @desc    Récupérer les revenus du chauffeur
// @access  Private (Driver)
router.get('/earnings', authenticateDriver, getDriverEarnings);

// ================================
// ROUTES VÉHICULES
// ================================

// @route   POST /api/drivers/vehicles
// @desc    Ajouter un véhicule
// @access  Private (Driver)
router.post('/vehicles', authenticateDriver, vehicleValidation, validateRequest, addVehicle);

// @route   GET /api/drivers/vehicles
// @desc    Récupérer les véhicules du chauffeur
// @access  Private (Driver)
router.get('/vehicles', authenticateDriver, getDriverVehicles);

// @route   PUT /api/drivers/vehicles/:vehicleId/toggle
// @desc    Activer/désactiver un véhicule
// @access  Private (Driver)
router.put('/vehicles/:vehicleId/toggle', authenticateDriver, [
    body('isActive')
        .isBoolean()
        .withMessage('Statut d\'activation invalide')
], validateRequest, toggleVehicleStatus);

// ================================
// ROUTES COURSES
// ================================

// @route   GET /api/drivers/active-ride
// @desc    Récupérer la course active du chauffeur
// @access  Private (Driver)
router.get('/active-ride', authenticateDriver, getActiveRide);

// ================================
// ROUTES DOCUMENTS
// ================================

// @route   POST /api/drivers/documents
// @desc    Uploader un document
// @access  Private (Driver)
router.post('/documents', authenticateDriver, upload.single('document'), [
    body('type')
        .isIn(['DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'INSURANCE', 'PROFESSIONAL_LICENSE', 'IDENTITY_CARD', 'BACKGROUND_CHECK'])
        .withMessage('Type de document invalide'),
    body('expiryDate')
        .optional()
        .isISO8601()
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('La date d\'expiration doit être future');
            }
            return true;
        })
], validateRequest, uploadDocument);

// @route   GET /api/drivers/documents
// @desc    Récupérer les documents du chauffeur
// @access  Private (Driver)
router.get('/documents', authenticateDriver, getDriverDocuments);

// ================================
// ROUTES UTILITAIRES
// ================================

// @route   GET /api/drivers/dashboard
// @desc    Récupérer les données du tableau de bord chauffeur
// @access  Private (Driver)
router.get('/dashboard', authenticateDriver, async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Statistiques aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayStats, weekStats, activeRide, pendingRequests] = await Promise.all([
            // Stats du jour
            prisma.booking.aggregate({
                where: {
                    driverId,
                    completedAt: {
                        gte: today,
                        lt: tomorrow
                    },
                    status: 'COMPLETED'
                },
                _count: { id: true },
                _sum: { finalPrice: true }
            }),

            // Stats de la semaine
            prisma.booking.aggregate({
                where: {
                    driverId,
                    completedAt: {
                        gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    },
                    status: 'COMPLETED'
                },
                _count: { id: true },
                _sum: { finalPrice: true }
            }),

            // Course active
            prisma.booking.findFirst({
                where: {
                    driverId,
                    status: {
                        in: ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS']
                    }
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    }
                }
            }),

            // Demandes en attente (pour info)
            prisma.booking.count({
                where: {
                    status: 'PENDING',
                    scheduledFor: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
                    }
                }
            })
        ]);

        // Infos du chauffeur
        const driverInfo = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                status: true,
                isOnline: true,
                rating: true,
                totalRides: true
            }
        });

        const dashboard = {
            today: {
                rides: todayStats._count.id || 0,
                earnings: todayStats._sum.finalPrice || 0
            },
            week: {
                rides: weekStats._count.id || 0,
                earnings: weekStats._sum.finalPrice || 0
            },
            driver: driverInfo,
            activeRide,
            pendingRequests
        };

        res.json({
            success: true,
            data: { dashboard }
        });

    } catch (error) {
        console.error('Error in getDashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du tableau de bord'
        });
    }
});

// @route   GET /api/drivers/nearby-requests
// @desc    Récupérer les demandes de course à proximité
// @access  Private (Driver)
router.get('/nearby-requests', authenticateDriver, async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { radius = 10 } = req.query; // Rayon en km
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Récupérer la position actuelle du chauffeur
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                currentLat: true,
                currentLng: true,
                status: true,
                isOnline: true,
                vehicles: {
                    where: { isActive: true },
                    select: { category: true }
                }
            }
        });

        if (!driver || !driver.isOnline || driver.status !== 'AVAILABLE') {
            return res.json({
                success: true,
                data: { requests: [] },
                message: 'Vous devez être en ligne et disponible'
            });
        }

        if (!driver.currentLat || !driver.currentLng) {
            return res.json({
                success: true,
                data: { requests: [] },
                message: 'Position non disponible'
            });
        }

        // Calculer les limites géographiques
        const lat = parseFloat(driver.currentLat);
        const lng = parseFloat(driver.currentLng);
        const radiusKm = parseFloat(radius);
        
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

        // Récupérer les demandes de course dans la zone
        const requests = await prisma.booking.findMany({
            where: {
                status: 'PENDING',
                scheduledFor: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 60 * 60 * 1000) // Dans l'heure
                },
                pickupLat: {
                    gte: lat - latDelta,
                    lte: lat + latDelta
                },
                pickupLng: {
                    gte: lng - lngDelta,
                    lte: lng + lngDelta
                }
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        membershipTier: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Calculer la distance exacte et filtrer
        const nearbyRequests = requests
            .map(request => {
                const distance = calculateDistance(
                    lat, lng,
                    parseFloat(request.pickupLat),
                    parseFloat(request.pickupLng)
                );
                return { ...request, distance };
            })
            .filter(request => request.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            data: { requests: nearbyRequests }
        });

    } catch (error) {
        console.error('Error in getNearbyRequests:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes'
        });
    }
});

// ================================
// ROUTES MAINTENANCE
// ================================

// @route   POST /api/drivers/vehicles/:vehicleId/maintenance
// @desc    Programmer un entretien véhicule
// @access  Private (Driver)
router.post('/vehicles/:vehicleId/maintenance', authenticateDriver, [
    body('type')
        .isIn(['REVISION', 'CONTROLE_TECHNIQUE', 'REPARATION', 'NETTOYAGE'])
        .withMessage('Type d\'entretien invalide'),
    body('scheduledDate')
        .isISO8601()
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('La date doit être future');
            }
            return true;
        }),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description trop longue')
], validateRequest, async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { vehicleId } = req.params;
        const { type, scheduledDate, description, cost } = req.body;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Vérifier que le véhicule appartient au chauffeur
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                driverId
            }
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Véhicule non trouvé'
            });
        }

        // Mettre à jour les dates d'entretien
        const updateData = {};
        if (type === 'REVISION') {
            updateData.lastMaintenance = new Date();
            updateData.nextMaintenance = new Date(scheduledDate);
        }

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: updateData
        });

        require('../utils/logger').info(`Maintenance scheduled for vehicle ${vehicleId} by driver ${driverId}`);

        res.json({
            success: true,
            message: 'Entretien programmé avec succès',
            data: {
                vehicleId,
                type,
                scheduledDate,
                description
            }
        });

    } catch (error) {
        console.error('Error in scheduleMaintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la programmation de l\'entretien'
        });
    }
});

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Calculer la distance entre deux points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100;
};

module.exports = router;