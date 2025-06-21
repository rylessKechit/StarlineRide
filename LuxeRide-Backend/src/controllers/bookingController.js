const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { sendToUser, sendToDriver, broadcastToAvailableDrivers } = require('../config/socket');

const prisma = new PrismaClient();

// ================================
// CRÉER UNE RÉSERVATION
// ================================
const createBooking = async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            pickupAddress,
            pickupLat,
            pickupLng,
            dropoffAddress,
            dropoffLat,
            dropoffLng,
            scheduledFor,
            vehicleCategory = 'BERLINE_EXECUTIVE',
            passengerCount = 1,
            specialRequests
        } = req.body;

        // Calculer la distance et le prix estimé
        const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
        const estimatedDuration = Math.round(distance * 2); // ~2 min par km en ville
        const estimatedPrice = calculatePrice(distance, vehicleCategory, scheduledFor);

        // Créer la réservation
        const booking = await prisma.booking.create({
            data: {
                userId,
                pickupAddress,
                pickupLat: parseFloat(pickupLat),
                pickupLng: parseFloat(pickupLng),
                dropoffAddress,
                dropoffLat: parseFloat(dropoffLat),
                dropoffLng: parseFloat(dropoffLng),
                scheduledFor: new Date(scheduledFor),
                estimatedDuration,
                estimatedDistance: distance,
                estimatedPrice,
                passengerCount: parseInt(passengerCount),
                specialRequests,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        membershipTier: true
                    }
                }
            }
        });

        // Chercher des chauffeurs disponibles dans un rayon de 10km
        const availableDrivers = await findAvailableDrivers(
            pickupLat, 
            pickupLng, 
            vehicleCategory,
            10 // rayon en km
        );

        logger.info(`New booking created: ${booking.id} - Found ${availableDrivers.length} available drivers`);

        // Si des chauffeurs sont disponibles, leur envoyer la demande
        if (availableDrivers.length > 0) {
            // Broadcast la demande via Socket.io aux chauffeurs disponibles
            req.app.get('io').emit('new_ride_request', {
                bookingId: booking.id,
                pickup: {
                    address: pickupAddress,
                    lat: pickupLat,
                    lng: pickupLng
                },
                dropoff: {
                    address: dropoffAddress,
                    lat: dropoffLat,
                    lng: dropoffLng
                },
                estimatedPrice,
                estimatedDistance: distance,
                estimatedDuration,
                passengerCount,
                vehicleCategory,
                clientInfo: {
                    firstName: booking.user.firstName,
                    membershipTier: booking.user.membershipTier
                },
                specialRequests
            });

            // Programmer un timeout si aucun chauffeur n'accepte en 2 minutes
            setTimeout(async () => {
                const bookingCheck = await prisma.booking.findUnique({
                    where: { id: booking.id },
                    select: { status: true }
                });

                if (bookingCheck?.status === 'PENDING') {
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { 
                            status: 'CANCELLED',
                            cancellationReason: 'Aucun chauffeur disponible'
                        }
                    });

                    // Notifier le client
                    sendToUser(req.app.get('io'), userId, 'booking_cancelled', {
                        bookingId: booking.id,
                        reason: 'Aucun chauffeur disponible dans votre zone'
                    });
                }
            }, 120000); // 2 minutes
        }

        res.status(201).json({
            success: true,
            message: 'Réservation créée avec succès',
            data: {
                booking: {
                    id: booking.id,
                    pickupAddress,
                    dropoffAddress,
                    scheduledFor: booking.scheduledFor,
                    estimatedPrice,
                    estimatedDuration,
                    estimatedDistance: distance,
                    status: booking.status
                },
                availableDrivers: availableDrivers.length
            }
        });

    } catch (error) {
        logger.error('Error in createBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la réservation'
        });
    }
};

// ================================
// CHAUFFEUR ACCEPTE UNE COURSE
// ================================
const acceptBooking = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { bookingId } = req.params;

        // Vérifier que la réservation existe et est disponible
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true
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

        if (booking.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cette réservation n\'est plus disponible'
            });
        }

        // Vérifier que le chauffeur a un véhicule actif
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            include: {
                vehicles: {
                    where: { isActive: true },
                    take: 1
                }
            }
        });

        if (!driver || driver.vehicles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun véhicule actif trouvé'
            });
        }

        const vehicle = driver.vehicles[0];

        // Assigner le chauffeur et le véhicule à la réservation
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                driverId,
                vehicleId: vehicle.id,
                status: 'DRIVER_ASSIGNED'
            },
            include: {
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
                        id: true,
                        brand: true,
                        model: true,
                        color: true,
                        licensePlate: true,
                        category: true
                    }
                }
            }
        });

        // Mettre à jour le statut du chauffeur
        await prisma.driver.update({
            where: { id: driverId },
            data: { status: 'BUSY' }
        });

        logger.info(`Booking ${bookingId} accepted by driver ${driverId}`);

        // Notifier le client
        sendToUser(req.app.get('io'), booking.user.id, 'ride_accepted', {
            bookingId,
            driver: updatedBooking.driver,
            vehicle: updatedBooking.vehicle,
            estimatedArrival: calculateArrivalTime(
                updatedBooking.driver.currentLat,
                updatedBooking.driver.currentLng,
                booking.pickupLat,
                booking.pickupLng
            )
        });

        // Notifier les autres chauffeurs que la course n'est plus disponible
        req.app.get('io').emit('ride_no_longer_available', { bookingId });

        res.json({
            success: true,
            message: 'Course acceptée avec succès',
            data: {
                booking: updatedBooking,
                clientInfo: booking.user
            }
        });

    } catch (error) {
        logger.error('Error in acceptBooking:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'acceptation de la course'
        });
    }
};

// ================================
// RÉCUPÉRER LES RÉSERVATIONS UTILISATEUR
// ================================
const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.user;
        const { status, limit = 20, offset = 0 } = req.query;

        const whereCondition = { userId };
        if (status) {
            whereCondition.status = status;
        }

        const bookings = await prisma.booking.findMany({
            where: whereCondition,
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rating: true
                    }
                },
                vehicle: {
                    select: {
                        brand: true,
                        model: true,
                        color: true,
                        licensePlate: true
                    }
                },
                payment: {
                    select: {
                        amount: true,
                        status: true,
                        method: true
                    }
                },
                review: {
                    select: {
                        id: true,
                        overallRating: true,
                        comment: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        res.json({
            success: true,
            data: { bookings }
        });

    } catch (error) {
        logger.error('Error in getUserBookings:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des réservations'
        });
    }
};

// ================================
// RÉCUPÉRER LES COURSES CHAUFFEUR
// ================================
const getDriverBookings = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { status, limit = 20, offset = 0 } = req.query;

        const whereCondition = { driverId };
        if (status) {
            whereCondition.status = status;
        }

        const bookings = await prisma.booking.findMany({
            where: whereCondition,
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
                payment: {
                    select: {
                        amount: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        res.json({
            success: true,
            data: { bookings }
        });

    } catch (error) {
        logger.error('Error in getDriverBookings:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des courses'
        });
    }
};

// ================================
// METTRE À JOUR STATUT COURSE
// ================================
const updateBookingStatus = async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { bookingId } = req.params;
        const { status, location } = req.body;

        // Vérifier que l'utilisateur a le droit de modifier cette réservation
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

        const hasPermission = (userType === 'user' && booking.user.id === userId) ||
                             (userType === 'driver' && booking.driver?.id === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // Données à mettre à jour
        const updateData = { status };

        // Ajouter des timestamps selon le statut
        switch (status) {
            case 'DRIVER_EN_ROUTE':
                // Le chauffeur se dirige vers le client
                break;
            case 'DRIVER_ARRIVED':
                updateData.arrivedAt = new Date();
                break;
            case 'IN_PROGRESS':
                updateData.startedAt = new Date();
                break;
            case 'COMPLETED':
                updateData.completedAt = new Date();
                // Remettre le chauffeur disponible
                if (booking.driver?.id) {
                    await prisma.driver.update({
                        where: { id: booking.driver.id },
                        data: { status: 'AVAILABLE' }
                    });
                }
                break;
            case 'CANCELLED':
                updateData.cancelledAt = new Date();
                // Remettre le chauffeur disponible si assigné
                if (booking.driver?.id) {
                    await prisma.driver.update({
                        where: { id: booking.driver.id },
                        data: { status: 'AVAILABLE' }
                    });
                }
                break;
        }

        // Mettre à jour la position du chauffeur si fournie
        if (location && userType === 'driver') {
            await prisma.driver.update({
                where: { id: userId },
                data: {
                    currentLat: parseFloat(location.lat),
                    currentLng: parseFloat(location.lng),
                    lastLocationUpdate: new Date()
                }
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: updateData
        });

        logger.info(`Booking ${bookingId} status updated to ${status} by ${userType} ${userId}`);

        // Notifier l'autre partie via Socket.io
        const targetUserId = userType === 'driver' ? booking.user.id : booking.driver?.id;
        if (targetUserId) {
            const eventName = `booking_status_${status.toLowerCase()}`;
            sendToUser(req.app.get('io'), targetUserId, eventName, {
                bookingId,
                status,
                timestamp: new Date(),
                location: userType === 'driver' ? location : undefined
            });
        }

        res.json({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: { booking: updatedBooking }
        });

    } catch (error) {
        logger.error('Error in updateBookingStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut'
        });
    }
};

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Calculer la distance entre deux points (formule haversine)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 100) / 100; // Arrondi à 2 décimales
};

// Calculer le prix en fonction de la distance et du type de véhicule
const calculatePrice = (distance, vehicleCategory, scheduledFor) => {
    const basePrices = {
        BERLINE_EXECUTIVE: { base: 8, perKm: 2.5 },
        SUV_LUXE: { base: 12, perKm: 3.0 },
        VAN_PREMIUM: { base: 15, perKm: 3.5 },
        SUPERCAR: { base: 25, perKm: 5.0 },
        ELECTRIC_PREMIUM: { base: 10, perKm: 2.8 }
    };

    const pricing = basePrices[vehicleCategory] || basePrices.BERLINE_EXECUTIVE;
    let price = pricing.base + (distance * pricing.perKm);

    // Majoration heures de pointe (7-9h et 17-19h)
    const hour = new Date(scheduledFor).getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        price *= 1.3; // +30%
    }

    // Majoration weekend
    const day = new Date(scheduledFor).getDay();
    if (day === 0 || day === 6) {
        price *= 1.2; // +20%
    }

    return Math.round(price * 100) / 100; // Arrondi à 2 décimales
};

// Trouver les chauffeurs disponibles
const findAvailableDrivers = async (lat, lng, vehicleCategory, radiusKm) => {
    // Calcul approximatif des coordonnées dans un rayon donné
    const latDelta = radiusKm / 111; // 1 degré ≈ 111 km
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const drivers = await prisma.driver.findMany({
        where: {
            status: 'AVAILABLE',
            isOnline: true,
            isActive: true,
            currentLat: {
                gte: lat - latDelta,
                lte: lat + latDelta
            },
            currentLng: {
                gte: lng - lngDelta,
                lte: lng + lngDelta
            },
            vehicles: {
                some: {
                    isActive: true,
                    category: vehicleCategory
                }
            }
        },
        include: {
            vehicles: {
                where: {
                    isActive: true,
                    category: vehicleCategory
                },
                take: 1
            }
        }
    });

    // Filtrer par distance exacte et trier par proximité
    return drivers
        .map(driver => ({
            ...driver,
            distance: calculateDistance(lat, lng, driver.currentLat, driver.currentLng)
        }))
        .filter(driver => driver.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
};

// Calculer le temps d'arrivée estimé
const calculateArrivalTime = (driverLat, driverLng, pickupLat, pickupLng) => {
    if (!driverLat || !driverLng) return null;
    
    const distance = calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
    const estimatedMinutes = Math.round(distance * 2.5); // ~2.5 min par km en ville
    
    return new Date(Date.now() + estimatedMinutes * 60000);
};

module.exports = {
    createBooking,
    acceptBooking,
    getUserBookings,
    getDriverBookings,
    updateBookingStatus
};