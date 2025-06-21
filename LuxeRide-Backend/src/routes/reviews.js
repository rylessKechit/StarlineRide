const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    createReview,
    respondToReview,
    getDriverReviews,
    getUserReviews,
    getReview,
    reportReview,
    toggleReviewVisibility
} = require('../controllers/reviewController');
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

// Validation création d'avis
const createReviewValidation = [
    body('bookingId')
        .notEmpty()
        .isUUID()
        .withMessage('ID de réservation invalide'),
    body('overallRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Note globale invalide (1-5)'),
    body('punctualityRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Note ponctualité invalide (1-5)'),
    body('cleanlinessRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Note propreté invalide (1-5)'),
    body('professionalismRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Note professionnalisme invalide (1-5)'),
    body('vehicleRating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Note véhicule invalide (1-5)'),
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Commentaire trop long (max 1000 caractères)')
        .custom((value) => {
            // Vérifier qu'il n'y a pas de contenu inapproprié basique
            const inappropriateWords = ['merde', 'putain', 'connard', 'salope'];
            const lowerComment = value.toLowerCase();
            for (const word of inappropriateWords) {
                if (lowerComment.includes(word)) {
                    throw new Error('Le commentaire contient du contenu inapproprié');
                }
            }
            return true;
        })
];

// Validation réponse à un avis
const respondToReviewValidation = [
    body('response')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('La réponse doit contenir entre 10 et 500 caractères')
        .custom((value) => {
            // Vérification basique de professionnalisme
            const inappropriateWords = ['merde', 'putain', 'connard', 'salope'];
            const lowerResponse = value.toLowerCase();
            for (const word of inappropriateWords) {
                if (lowerResponse.includes(word)) {
                    throw new Error('La réponse contient du contenu inapproprié');
                }
            }
            return true;
        })
];

// Validation signalement
const reportReviewValidation = [
    body('reason')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('La raison doit contenir entre 10 et 500 caractères')
        .isIn([
            'Contenu inapproprié',
            'Spam',
            'Faux avis',
            'Harcèlement',
            'Discrimination',
            'Autre'
        ])
        .withMessage('Raison de signalement invalide')
];

// Validation visibilité
const visibilityValidation = [
    body('isPublic')
        .isBoolean()
        .withMessage('Visibilité invalide')
];

// ================================
// ROUTES CLIENTS
// ================================

// @route   POST /api/reviews
// @desc    Créer un avis après une course
// @access  Private (Client)
router.post('/', authenticateUser, createReviewValidation, validateRequest, createReview);

// @route   GET /api/reviews/my-reviews
// @desc    Récupérer les avis laissés par l'utilisateur
// @access  Private (Client)
router.get('/my-reviews', authenticateUser, getUserReviews);

// ================================
// ROUTES CHAUFFEURS
// ================================

// @route   POST /api/reviews/:reviewId/respond
// @desc    Répondre à un avis (chauffeur)
// @access  Private (Driver)
router.post('/:reviewId/respond', authenticateDriver, respondToReviewValidation, validateRequest, respondToReview);

// ================================
// ROUTES PUBLIQUES/COMMUNES
// ================================

// @route   GET /api/reviews/driver/:driverId
// @desc    Récupérer les avis d'un chauffeur (public)
// @access  Public
router.get('/driver/:driverId', getDriverReviews);

// @route   GET /api/reviews/:reviewId
// @desc    Récupérer un avis spécifique
// @access  Private/Public (selon visibilité)
router.get('/:reviewId', getReview);

// ================================
// ROUTES DE MODÉRATION
// ================================

// @route   POST /api/reviews/:reviewId/report
// @desc    Signaler un avis
// @access  Private
router.post('/:reviewId/report', authenticate, reportReviewValidation, validateRequest, reportReview);

// @route   PUT /api/reviews/:reviewId/visibility
// @desc    Changer la visibilité d'un avis
// @access  Private (Auteur ou Admin)
router.put('/:reviewId/visibility', authenticate, visibilityValidation, validateRequest, toggleReviewVisibility);

// ================================
// ROUTES STATISTIQUES
// ================================

// @route   GET /api/reviews/driver/:driverId/stats
// @desc    Statistiques détaillées des avis d'un chauffeur
// @access  Public
router.get('/driver/:driverId/stats', async (req, res) => {
    try {
        const { driverId } = req.params;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Vérifier que le chauffeur existe
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                firstName: true,
                lastName: true,
                rating: true,
                totalRides: true
            }
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Chauffeur non trouvé'
            });
        }

        // Statistiques globales
        const globalStats = await prisma.review.aggregate({
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

        // Répartition par note
        const ratingDistribution = await prisma.review.groupBy({
            by: ['overallRating'],
            where: { driverId, isPublic: true },
            _count: { id: true },
            orderBy: { overallRating: 'desc' }
        });

        // Evolution des notes sur les 6 derniers mois
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await prisma.$queryRaw`
            SELECT 
                DATE_TRUNC('month', "createdAt") as month,
                COUNT(*)::int as review_count,
                AVG("overallRating")::numeric(3,2) as avg_rating
            FROM "reviews"
            WHERE "driverId" = ${driverId}
                AND "isPublic" = true
                AND "createdAt" >= ${sixMonthsAgo}
            GROUP BY DATE_TRUNC('month', "createdAt")
            ORDER BY month ASC
        `;

        // Avis avec commentaires récents
        const recentComments = await prisma.review.findMany({
            where: {
                driverId,
                isPublic: true,
                comment: { not: null }
            },
            select: {
                overallRating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        membershipTier: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Mots-clés fréquents dans les commentaires
        const allComments = await prisma.review.findMany({
            where: {
                driverId,
                isPublic: true,
                comment: { not: null }
            },
            select: { comment: true }
        });

        const wordFrequency = analyzeCommentKeywords(allComments.map(r => r.comment));

        res.json({
            success: true,
            data: {
                driver: {
                    name: `${driver.firstName} ${driver.lastName}`,
                    currentRating: driver.rating,
                    totalRides: driver.totalRides
                },
                globalStats: {
                    totalReviews: globalStats._count.id || 0,
                    averageRating: Math.round((globalStats._avg.overallRating || 0) * 10) / 10,
                    averagePunctuality: Math.round((globalStats._avg.punctualityRating || 0) * 10) / 10,
                    averageCleanliness: Math.round((globalStats._avg.cleanlinessRating || 0) * 10) / 10,
                    averageProfessionalism: Math.round((globalStats._avg.professionalismRating || 0) * 10) / 10,
                    averageVehicle: Math.round((globalStats._avg.vehicleRating || 0) * 10) / 10
                },
                ratingDistribution: ratingDistribution.map(item => ({
                    rating: item.overallRating,
                    count: item._count.id,
                    percentage: Math.round((item._count.id / (globalStats._count.id || 1)) * 100)
                })),
                monthlyTrend: monthlyStats.map(stat => ({
                    month: stat.month,
                    reviewCount: stat.review_count,
                    averageRating: parseFloat(stat.avg_rating) || 0
                })),
                recentComments: recentComments.map(review => ({
                    rating: review.overallRating,
                    comment: review.comment,
                    date: review.createdAt,
                    clientName: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`,
                    membershipTier: review.user.membershipTier
                })),
                keywordAnalysis: wordFrequency
            }
        });

    } catch (error) {
        console.error('Error in getDriverReviewStats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// @route   GET /api/reviews/summary/recent
// @desc    Résumé des avis récents (tous chauffeurs)
// @access  Public
router.get('/summary/recent', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const recentReviews = await prisma.review.findMany({
            where: {
                isPublic: true,
                comment: { not: null },
                overallRating: { gte: 4 } // Que les bonnes notes
            },
            include: {
                driver: {
                    select: {
                        firstName: true,
                        lastName: true,
                        rating: true
                    }
                },
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
                        dropoffAddress: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            data: {
                reviews: recentReviews.map(review => ({
                    id: review.id,
                    rating: review.overallRating,
                    comment: review.comment.length > 150 ? 
                        review.comment.substring(0, 150) + '...' : 
                        review.comment,
                    date: review.createdAt,
                    driver: {
                        name: `${review.driver.firstName} ${review.driver.lastName}`,
                        rating: review.driver.rating
                    },
                    client: {
                        name: `${review.user.firstName} ${review.user.lastName.charAt(0)}.`,
                        membershipTier: review.user.membershipTier
                    },
                    route: {
                        from: review.booking.pickupAddress.split(',')[0], // Premier partie de l'adresse
                        to: review.booking.dropoffAddress.split(',')[0]
                    }
                }))
            }
        });

    } catch (error) {
        console.error('Error in getRecentReviews:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des avis récents'
        });
    }
});

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Analyser les mots-clés dans les commentaires
const analyzeCommentKeywords = (comments) => {
    const positiveWords = [
        'excellent', 'parfait', 'super', 'génial', 'formidable', 'fantastique',
        'propre', 'ponctuel', 'professionnel', 'courtois', 'aimable', 'sympa',
        'confortable', 'sûr', 'rapide', 'efficace', 'recommande'
    ];
    
    const negativeWords = [
        'mauvais', 'horrible', 'nul', 'décevant', 'sale', 'retard',
        'impoli', 'désagréable', 'dangereux', 'lent', 'incompétent'
    ];

    const wordCount = {};
    const sentiment = { positive: 0, negative: 0, neutral: 0 };

    comments.forEach(comment => {
        if (!comment) return;
        
        const words = comment.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

        let commentSentiment = 0;

        words.forEach(word => {
            // Compter les mots fréquents
            wordCount[word] = (wordCount[word] || 0) + 1;

            // Analyser le sentiment
            if (positiveWords.includes(word)) {
                commentSentiment += 1;
            } else if (negativeWords.includes(word)) {
                commentSentiment -= 1;
            }
        });

        // Classer le sentiment du commentaire
        if (commentSentiment > 0) {
            sentiment.positive++;
        } else if (commentSentiment < 0) {
            sentiment.negative++;
        } else {
            sentiment.neutral++;
        }
    });

    // Retourner les mots les plus fréquents (excluant les mots courants)
    const commonWords = ['très', 'bien', 'avec', 'pour', 'dans', 'tout', 'plus', 'comme', 'une', 'qui'];
    const topWords = Object.entries(wordCount)
        .filter(([word]) => !commonWords.includes(word))
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

    return {
        topKeywords: topWords,
        sentiment: {
            positive: sentiment.positive,
            negative: sentiment.negative,
            neutral: sentiment.neutral,
            total: sentiment.positive + sentiment.negative + sentiment.neutral
        }
    };
};

module.exports = router;