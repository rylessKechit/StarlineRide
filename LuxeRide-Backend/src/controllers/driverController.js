const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ================================
// METTRE À JOUR STATUT CHAUFFEUR
// ================================
const updateDriverStatus = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { status, isOnline, location } = req.body;

        const updateData = {};

        if (status) {
            updateData.status = status;
        }

        if (typeof isOnline === 'boolean') {
            updateData.isOnline = isOnline;
        }

        if (location) {
            updateData.currentLat = parseFloat(location.lat);
            updateData.currentLng = parseFloat(location.lng);
            updateData.lastLocationUpdate = new Date();
        }

        const driver = await prisma.driver.update({
            where: { id: driverId },
            data: updateData,
            select: {
                id: true,
                status: true,
                isOnline: true,
                currentLat: true,
                currentLng: true,
                lastLocationUpdate: true
            }
        });

        logger.info(`Driver ${driverId} status updated:`, updateData);

        // Notifier via Socket.io si nécessaire
        req.app.get('io').emit('driver_status_update', {
            driverId,
            status: driver.status,
            isOnline: driver.isOnline,
            location: location || null
        });

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: { driver }
        });

    } catch (error) {
        logger.error('Error in updateDriverStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut'
        });
    }
};

// ================================
// METTRE À JOUR POSITION
// ================================
const updateLocation = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { lat, lng, heading, speed } = req.body;

        await prisma.driver.update({
            where: { id: driverId },
            data: {
                currentLat: parseFloat(lat),
                currentLng: parseFloat(lng),
                lastLocationUpdate: new Date()
            }
        });

        // Diffuser la position aux clients qui ont une course active avec ce chauffeur
        const activeBookings = await prisma.booking.findMany({
            where: {
                driverId,
                status: {
                    in: ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS']
                }
            },
            select: {
                userId: true,
                id: true
            }
        });

        // Envoyer la position à chaque client concerné
        activeBookings.forEach(booking => {
            req.app.get('io').to(`user_${booking.userId}`).emit('driver_location_update', {
                bookingId: booking.id,
                location: { lat: parseFloat(lat), lng: parseFloat(lng) },
                heading: heading || null,
                speed: speed || null,
                timestamp: new Date()
            });
        });

        res.json({
            success: true,
            message: 'Position mise à jour'
        });

    } catch (error) {
        logger.error('Error in updateLocation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la position'
        });
    }
};

// ================================
// RÉCUPÉRER STATISTIQUES CHAUFFEUR
// ================================
const getDriverStats = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { period = 'month' } = req.query;

        let dateFilter;
        const now = new Date();
        
        switch (period) {
            case 'day':
                dateFilter = {
                    gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                };
                break;
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                dateFilter = { gte: weekStart };
                break;
            case 'month':
                dateFilter = {
                    gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            case 'year':
                dateFilter = {
                    gte: new Date(now.getFullYear(), 0, 1)
                };
                break;
            default:
                dateFilter = {
                    gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
        }

        // Statistiques des courses
        const bookingStats = await prisma.booking.aggregate({
            where: {
                driverId,
                completedAt: dateFilter,
                status: 'COMPLETED'
            },
            _count: { id: true },
            _sum: { 
                finalPrice: true,
                estimatedDistance: true 
            },
            _avg: { finalPrice: true }
        });

        // Revenus détaillés
        const earnings = await prisma.earning.aggregate({
            where: {
                driverId,
                date: dateFilter
            },
            _sum: {
                grossAmount: true,
                commission: true,
                netAmount: true
            }
        });

        // Évaluations récentes
        const recentReviews = await prisma.review.findMany({
            where: {
                driverId,
                createdAt: dateFilter
            },
            select: {
                overallRating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Note moyenne sur la période
        const avgRating = await prisma.review.aggregate({
            where: {
                driverId,
                createdAt: dateFilter
            },
            _avg: { overallRating: true }
        });

        const stats = {
            period,
            rides: {
                total: bookingStats._count.id || 0,
                totalRevenue: bookingStats._sum.finalPrice || 0,
                averageRevenue: bookingStats._avg.finalPrice || 0,
                totalDistance: bookingStats._sum.estimatedDistance || 0
            },
            earnings: {
                gross: earnings._sum.grossAmount || 0,
                commission: earnings._sum.commission || 0,
                net: earnings._sum.netAmount || 0
            },
            rating: {
                average: avgRating._avg.overallRating || 0,
                reviewCount: recentReviews.length
            },
            recentReviews: recentReviews.slice(0, 5) // 5 derniers avis
        };

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        logger.error('Error in getDriverStats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
};

// ================================
// RÉCUPÉRER REVENUS
// ================================
const getDriverEarnings = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { startDate, endDate, groupBy = 'day' } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            };
        }

        const earnings = await prisma.earning.findMany({
            where: {
                driverId,
                ...dateFilter
            },
            orderBy: { date: 'desc' },
            take: 100
        });

        // Grouper les données selon la période demandée
        const groupedEarnings = groupEarningsByPeriod(earnings, groupBy);

        res.json({
            success: true,
            data: { 
                earnings: groupedEarnings,
                total: earnings.reduce((sum, e) => sum + parseFloat(e.netAmount), 0)
            }
        });

    } catch (error) {
        logger.error('Error in getDriverEarnings:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des revenus'
        });
    }
};

// ================================
// AJOUTER/MODIFIER VÉHICULE
// ================================
const addVehicle = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const {
            brand,
            model,
            year,
            color,
            licensePlate,
            category,
            maxPassengers,
            features = [],
            hasWifi = false,
            hasChargers = false,
            hasAC = true
        } = req.body;

        // Vérifier que la plaque n'existe pas déjà
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { licensePlate }
        });

        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Cette plaque d\'immatriculation existe déjà'
            });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                driverId,
                brand,
                model,
                year: parseInt(year),
                color,
                licensePlate: licensePlate.toUpperCase(),
                category,
                maxPassengers: parseInt(maxPassengers),
                features,
                hasWifi,
                hasChargers,
                hasAC,
                isActive: false // Nécessite validation admin
            }
        });

        logger.info(`New vehicle added by driver ${driverId}: ${vehicle.id}`);

        res.status(201).json({
            success: true,
            message: 'Véhicule ajouté avec succès. En attente de validation.',
            data: { vehicle }
        });

    } catch (error) {
        logger.error('Error in addVehicle:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du véhicule'
        });
    }
};

// ================================
// RÉCUPÉRER VÉHICULES DU CHAUFFEUR
// ================================
const getDriverVehicles = async (req, res) => {
    try {
        const { userId: driverId } = req.user;

        const vehicles = await prisma.vehicle.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { vehicles }
        });

    } catch (error) {
        logger.error('Error in getDriverVehicles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des véhicules'
        });
    }
};

// ================================
// ACTIVER/DÉSACTIVER VÉHICULE
// ================================
const toggleVehicleStatus = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { vehicleId } = req.params;
        const { isActive } = req.body;

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

        // Si on active ce véhicule, désactiver les autres
        if (isActive) {
            await prisma.vehicle.updateMany({
                where: { driverId },
                data: { isActive: false }
            });
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { isActive }
        });

        logger.info(`Vehicle ${vehicleId} status changed to ${isActive} by driver ${driverId}`);

        res.json({
            success: true,
            message: `Véhicule ${isActive ? 'activé' : 'désactivé'} avec succès`,
            data: { vehicle: updatedVehicle }
        });

    } catch (error) {
        logger.error('Error in toggleVehicleStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification du statut'
        });
    }
};

// ================================
// RÉCUPÉRER COURSE ACTIVE
// ================================
const getActiveRide = async (req, res) => {
    try {
        const { userId: driverId } = req.user;

        const activeRide = await prisma.booking.findFirst({
            where: {
                driverId,
                status: {
                    in: ['DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE', 'DRIVER_ARRIVED', 'IN_PROGRESS']
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        membershipTier: true,
                        specialRequests: true
                    }
                },
                vehicle: {
                    select: {
                        brand: true,
                        model: true,
                        licensePlate: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: { activeRide }
        });

    } catch (error) {
        logger.error('Error in getActiveRide:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la course active'
        });
    }
};

// ================================
// UPLOAD DOCUMENTS
// ================================
const uploadDocument = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { type, expiryDate } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        // Ici on uploadera le fichier vers Cloudinary
        // Pour l'instant, on simule
        const fileUrl = `/uploads/${req.file.filename}`;

        const document = await prisma.document.create({
            data: {
                driverId,
                type,
                fileName: req.file.originalname,
                fileUrl,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                isVerified: false
            }
        });

        logger.info(`Document uploaded by driver ${driverId}: ${document.id}`);

        res.status(201).json({
            success: true,
            message: 'Document uploadé avec succès',
            data: { document }
        });

    } catch (error) {
        logger.error('Error in uploadDocument:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload du document'
        });
    }
};

// ================================
// RÉCUPÉRER DOCUMENTS
// ================================
const getDriverDocuments = async (req, res) => {
    try {
        const { userId: driverId } = req.user;

        const documents = await prisma.document.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { documents }
        });

    } catch (error) {
        logger.error('Error in getDriverDocuments:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des documents'
        });
    }
};

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Grouper les revenus par période
const groupEarningsByPeriod = (earnings, groupBy) => {
    const grouped = {};

    earnings.forEach(earning => {
        let key;
        const date = new Date(earning.date);

        switch (groupBy) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week':
                const week = getWeekNumber(date);
                key = `${date.getFullYear()}-W${week}`;
                break;
            case 'month':
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
            default:
                key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) {
            grouped[key] = {
                period: key,
                gross: 0,
                commission: 0,
                net: 0,
                rides: 0
            };
        }

        grouped[key].gross += parseFloat(earning.grossAmount);
        grouped[key].commission += parseFloat(earning.commission);
        grouped[key].net += parseFloat(earning.netAmount);
        grouped[key].rides += 1;
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
};

// Calculer le numéro de semaine
const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

module.exports = {
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
};