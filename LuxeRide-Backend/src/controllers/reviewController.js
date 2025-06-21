const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ================================
// CRÉER UN AVIS
// ================================
const createReview = async (req, res) => {
    try {
        const { userId } = req.user;
        const {
            bookingId,
            overallRating,
            punctualityRating,
            cleanlinessRating,
            professionalismRating,
            vehicleRating,
            comment
        } = req.body;

        // Vérifier que la réservation existe et appartient à l'utilisateur
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                driver: { select: { id: true } },
                review: { select: { id: true } }
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Réservation non trouvée'
            });
        }

        if (booking.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        if (booking.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'La course doit être terminée pour laisser un avis'
            });
        }

        if (booking.review) {
            return res.status(400).json({
                success: false,
                message: 'Un avis a déjà été laissé pour cette course'
            });
        }

        if (!booking.driverId) {
            return res.status(400).json({
                success: false,
                message: 'Aucun chauffeur assigné à cette course'
            });
        }

        // Créer l'avis
        const review = await prisma.review.create({
            data: {
                bookingId,
                userId,
                driverId: booking.driverId,
                overallRating: parseInt(overallRating),
                punctualityRating: parseInt(punctualityRating),
                cleanlinessRating: parseInt(cleanlinessRating),
                professionalismRating: parseInt(professionalismRating),
                vehicleRating: parseInt(vehicleRating),
                comment: comment?.trim() || null
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        membershipTier: true
                    }
                }
            }
        });

        // Mettre à jour la note moyenne du chauffeur
        await updateDriverRating(booking.driverId);

        logger.info(`Review created for booking ${bookingId} by user ${userId}`);

        // Notifier le chauffeur
        req.app.get('io').to(`driver_${booking.driverId}`).emit('new_review', {
            bookingId,
            rating: overallRating,
            comment: comment?.substring(0, 100) + (comment?.length > 100 ? '...' : ''),
            clientName: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`
        });

        res.status(201).json({
            success: true,
            message: 'Avis créé avec succès',
            data: { review }
        });

    } catch (error) {
        logger.error('Error in createReview:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'avis'
        });
    }
};

// ================================
// RÉPONDRE À UN AVIS (CHAUFFEUR)
// ================================
const respondToReview = async (req, res) => {
    try {
        const { userId: driverId } = req.user;
        const { reviewId } = req.params;
        const { response } = req.body;

        // Vérifier que l'avis existe et concerne ce chauffeur
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                booking: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Avis non trouvé'
            });
        }

        if (review.driverId !== driverId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        if (review.driverResponse) {
            return res.status(400).json({
                success: false,
                message: 'Une réponse a déjà été donnée à cet avis'
            });
        }

        // Mettre à jour avec la réponse
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                driverResponse: response.trim()
            }
        });

        logger.info(`Driver ${driverId} responded to review ${reviewId}`);

        // Notifier le client
        req.app.get('io').to(`user_${review.booking.userId}`).emit('review_response', {
            reviewId,
            response: response.substring(0, 100) + (response.length > 100 ? '...' : '')
        });

        res.json({
            success: true,
            message: 'Réponse ajoutée avec succès',
            data: { review: updatedReview }
        });

    } catch (error) {
        logger.error('Error in respondToReview:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de la réponse'
        });
    }
};

// ================================
// RÉCUPÉRER AVIS D'UN CHAUFFEUR
// ================================
const getDriverReviews = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { limit = 20, offset = 0, rating, sortBy = 'recent' } = req.query;

        let whereCondition = { driverId, isPublic: true };
        
        if (rating) {
            whereCondition.overallRating = parseInt(rating);
        }

        let orderBy;
        switch (sortBy) {
            case 'rating_high':
                orderBy = { overallRating: 'desc' };
                break;
            case 'rating_low':
                orderBy = { overallRating: 'asc' };
                break;
            case 'recent':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        const reviews = await prisma.review.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        membershipTier: true
                    }
                },
                booking: {
                    select: {
                        pickupAddress: true,
                        dropoffAddress: true,
                        completedAt: true,
                        estimatedDistance: true
                    }
                }
            },
            orderBy,
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        // Statistiques des avis
        const stats = await prisma.review.aggregate({
            where: { driverId, isPublic: true },
            _count: { id: true },
            _avg: {
                overallRating: true,
                punctualityRating: true,
                cleanlinessRating: true,
                professionalismRating: true,
                vehicleRating: true
            }
        });

        // Répartition des notes
        const ratingDistribution = await prisma.review.groupBy({
            by: ['overallRating'],
            where: { driverId, isPublic: true },
            _count: { id: true },
            orderBy: { overallRating: 'desc' }
        });

        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    ...review,
                    user: {
                        name: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`,
                        membershipTier: review.user.membershipTier
                    }
                })),
                stats: {
                    totalReviews: stats._count.id || 0,
                    averageRating: Math.round((stats._avg.overallRating || 0) * 10) / 10,
                    averagePunctuality: Math.round((stats._avg.punctualityRating || 0) * 10) / 10,
                    averageCleanliness: Math.round((stats._avg.cleanlinessRating || 0) * 10) / 10,
                    averageProfessionalism: Math.round((stats._avg.professionalismRating || 0) * 10) / 10,
                    averageVehicle: Math.round((stats._avg.vehicleRating || 0) * 10) / 10
                },
                ratingDistribution: ratingDistribution.map(item => ({
                    rating: item.overallRating,
                    count: item._count.id
                }))
            }
        });

    } catch (error) {
        logger.error('Error in getDriverReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des avis'
        });
    }
};

// ================================
// RÉCUPÉRER AVIS D'UN UTILISATEUR
// ================================
const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.user;
        const { limit = 20, offset = 0 } = req.query;

        const reviews = await prisma.review.findMany({
            where: { userId },
            include: {
                driver: {
                    select: {
                        firstName: true,
                        lastName: true,
                        rating: true
                    }
                },
                booking: {
                    select: {
                        pickupAddress: true,
                        dropoffAddress: true,
                        completedAt: true,
                        finalPrice: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        const totalReviews = await prisma.review.count({
            where: { userId }
        });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    total: totalReviews,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < totalReviews
                }
            }
        });

    } catch (error) {
        logger.error('Error in getUserReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des avis'
        });
    }
};

// ================================
// RÉCUPÉRER UN AVIS SPÉCIFIQUE
// ================================
const getReview = async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { reviewId } = req.params;

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        membershipTier: true
                    }
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rating: true
                    }
                },
                booking: {
                    select: {
                        pickupAddress: true,
                        dropoffAddress: true,
                        completedAt: true,
                        finalPrice: true,
                        estimatedDistance: true
                    }
                }
            }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Avis non trouvé'
            });
        }

        // Vérifier les permissions
        const hasPermission = userType === 'admin' ||
                             (userType === 'user' && review.userId === userId) ||
                             (userType === 'driver' && review.driverId === userId) ||
                             review.isPublic;

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        res.json({
            success: true,
            data: { review }
        });

    } catch (error) {
        logger.error('Error in getReview:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'avis'
        });
    }
};

// ================================
// SIGNALER UN AVIS
// ================================
const reportReview = async (req, res) => {
    try {
        const { userId } = req.user;
        const { reviewId } = req.params;
        const { reason } = req.body;

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Avis non trouvé'
            });
        }

        // Pour l'instant, on log le signalement
        // Dans une vraie app, on créerait une table "reports"
        logger.warn(`Review ${reviewId} reported by user ${userId}: ${reason}`);

        res.json({
            success: true,
            message: 'Avis signalé avec succès. Notre équipe va l\'examiner.'
        });

    } catch (error) {
        logger.error('Error in reportReview:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du signalement'
        });
    }
};

// ================================
// MASQUER/AFFICHER AVIS
// ================================
const toggleReviewVisibility = async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { reviewId } = req.params;
        const { isPublic } = req.body;

        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Avis non trouvé'
            });
        }

        // Seul l'auteur ou un admin peut modifier la visibilité
        const hasPermission = userType === 'admin' || 
                             (userType === 'user' && review.userId === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: { isPublic: Boolean(isPublic) }
        });

        // Recalculer la note du chauffeur si nécessaire
        if (review.isPublic !== Boolean(isPublic)) {
            await updateDriverRating(review.driverId);
        }

        res.json({
            success: true,
            message: `Avis ${isPublic ? 'rendu public' : 'masqué'} avec succès`,
            data: { review: updatedReview }
        });

    } catch (error) {
        logger.error('Error in toggleReviewVisibility:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la modification de la visibilité'
        });
    }
};

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Mettre à jour la note moyenne d'un chauffeur
const updateDriverRating = async (driverId) => {
    try {
        const stats = await prisma.review.aggregate({
            where: {
                driverId,
                isPublic: true,
                isVerified: true
            },
            _avg: { overallRating: true },
            _count: { id: true }
        });

        const newRating = stats._avg.overallRating || 5.0;
        const reviewCount = stats._count.id || 0;

        await prisma.driver.update({
            where: { id: driverId },
            data: {
                rating: Math.round(newRating * 10) / 10 // Arrondi à 1 décimale
            }
        });

        logger.info(`Driver ${driverId} rating updated to ${newRating} (${reviewCount} reviews)`);

        return newRating;

    } catch (error) {
        logger.error('Error updating driver rating:', error);
    }
};

module.exports = {
    createReview,
    respondToReview,
    getDriverReviews,
    getUserReviews,
    getReview,
    reportReview,
    toggleReviewVisibility
};