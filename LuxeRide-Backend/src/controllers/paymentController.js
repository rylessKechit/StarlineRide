const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ================================
// CRÉER PAYMENT INTENT
// ================================
const createPaymentIntent = async (req, res) => {
    try {
        const { userId } = req.user;
        const { bookingId, paymentMethod = 'CARD' } = req.body;

        // Récupérer la réservation
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        membershipTier: true
                    }
                },
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
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

        if (booking.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        if (booking.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'La course doit être terminée pour effectuer le paiement'
            });
        }

        // Vérifier si un paiement existe déjà
        const existingPayment = await prisma.payment.findUnique({
            where: { bookingId }
        });

        if (existingPayment && existingPayment.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Cette course a déjà été payée'
            });
        }

        // Calculer le prix final
        const priceCalculation = calculateFinalPrice(booking);
        
        // Créer le Payment Intent Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(priceCalculation.total * 100), // en centimes
            currency: 'eur',
            customer: booking.user.stripeCustomerId || undefined,
            metadata: {
                bookingId,
                userId,
                driverId: booking.driver?.id || '',
                userEmail: booking.user.email
            },
            description: `Course LuxeRide - ${booking.pickupAddress} vers ${booking.dropoffAddress}`,
            automatic_payment_methods: {
                enabled: true
            }
        });

        // Créer ou mettre à jour l'enregistrement de paiement
        const paymentData = {
            bookingId,
            userId,
            amount: priceCalculation.total,
            currency: 'EUR',
            method: paymentMethod,
            status: 'PENDING',
            stripePaymentId: paymentIntent.id,
            basePrice: priceCalculation.basePrice,
            distancePrice: priceCalculation.distancePrice,
            timePrice: priceCalculation.timePrice,
            surcharge: priceCalculation.surcharge,
            discount: priceCalculation.discount
        };

        let payment;
        if (existingPayment) {
            payment = await prisma.payment.update({
                where: { id: existingPayment.id },
                data: paymentData
            });
        } else {
            payment = await prisma.payment.create({
                data: paymentData
            });
        }

        // Mettre à jour le prix final de la réservation
        await prisma.booking.update({
            where: { id: bookingId },
            data: { finalPrice: priceCalculation.total }
        });

        logger.info(`Payment intent created for booking ${bookingId}: ${paymentIntent.id}`);

        res.json({
            success: true,
            message: 'Payment Intent créé avec succès',
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentId: payment.id,
                amount: priceCalculation.total,
                breakdown: priceCalculation
            }
        });

    } catch (error) {
        logger.error('Error in createPaymentIntent:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du paiement'
        });
    }
};

// ================================
// CONFIRMER PAIEMENT
// ================================
const confirmPayment = async (req, res) => {
    try {
        const { userId } = req.user;
        const { paymentId, paymentIntentId, tip = 0 } = req.body;

        // Récupérer le paiement
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                booking: {
                    include: {
                        driver: { select: { id: true } }
                    }
                }
            }
        });

        if (!payment || payment.userId !== userId) {
            return res.status(404).json({
                success: false,
                message: 'Paiement non trouvé'
            });
        }

        // Vérifier le statut avec Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Ajouter le pourboire si fourni
            let finalAmount = parseFloat(payment.amount);
            if (tip > 0) {
                finalAmount += parseFloat(tip);
                
                // Mettre à jour le Payment Intent avec le pourboire
                await stripe.paymentIntents.update(paymentIntentId, {
                    amount: Math.round(finalAmount * 100)
                });
            }

            // Mettre à jour le paiement
            const updatedPayment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'COMPLETED',
                    stripeChargeId: paymentIntent.latest_charge,
                    tip: parseFloat(tip),
                    amount: finalAmount,
                    paidAt: new Date()
                }
            });

            // Calculer et enregistrer les revenus du chauffeur
            if (payment.booking.driver?.id) {
                await calculateDriverEarnings(payment.booking.driver.id, updatedPayment);
            }

            // Mettre à jour les points de fidélité
            await updateLoyaltyPoints(userId, finalAmount);

            logger.info(`Payment confirmed for booking ${payment.bookingId}: ${finalAmount}€`);

            // Notifier le chauffeur du paiement
            req.app.get('io').to(`driver_${payment.booking.driver?.id}`).emit('payment_received', {
                bookingId: payment.bookingId,
                amount: finalAmount,
                tip: parseFloat(tip)
            });

            res.json({
                success: true,
                message: 'Paiement confirmé avec succès',
                data: {
                    payment: updatedPayment,
                    finalAmount
                }
            });

        } else {
            // Paiement échoué
            await prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'FAILED' }
            });

            res.status(400).json({
                success: false,
                message: 'Le paiement a échoué',
                stripeStatus: paymentIntent.status
            });
        }

    } catch (error) {
        logger.error('Error in confirmPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la confirmation du paiement'
        });
    }
};

// ================================
// WEBHOOK STRIPE
// ================================
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            
            case 'charge.dispute.created':
                await handleDispute(event.data.object);
                break;
            
            default:
                logger.info(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        logger.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
};

// ================================
// REMBOURSER PAIEMENT
// ================================
const refundPayment = async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { paymentId, reason, amount: refundAmount } = req.body;

        // Récupérer le paiement
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                booking: {
                    include: {
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
                             (userType === 'user' && payment.booking.user.id === userId);

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        if (payment.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Seuls les paiements confirmés peuvent être remboursés'
            });
        }

        // Calculer le montant à rembourser
        const maxRefund = parseFloat(payment.amount);
        const actualRefundAmount = refundAmount ? 
            Math.min(parseFloat(refundAmount), maxRefund) : maxRefund;

        // Créer le remboursement Stripe
        const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
            amount: Math.round(actualRefundAmount * 100),
            reason: 'requested_by_customer',
            metadata: {
                bookingId: payment.bookingId,
                refundReason: reason || 'Demande client'
            }
        });

        // Mettre à jour le paiement
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: actualRefundAmount === maxRefund ? 'REFUNDED' : 'PARTIAL_REFUND',
                refundedAt: new Date()
            }
        });

        logger.info(`Refund created for payment ${paymentId}: ${actualRefundAmount}€`);

        res.json({
            success: true,
            message: 'Remboursement effectué avec succès',
            data: {
                refund,
                amount: actualRefundAmount,
                payment: updatedPayment
            }
        });

    } catch (error) {
        logger.error('Error in refundPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du remboursement'
        });
    }
};

// ================================
// HISTORIQUE PAIEMENTS
// ================================
const getPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.user;
        const { limit = 20, offset = 0, status } = req.query;

        const whereCondition = { userId };
        if (status) {
            whereCondition.status = status;
        }

        const payments = await prisma.payment.findMany({
            where: whereCondition,
            include: {
                booking: {
                    select: {
                        id: true,
                        pickupAddress: true,
                        dropoffAddress: true,
                        scheduledFor: true,
                        completedAt: true,
                        estimatedDistance: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        const total = await prisma.payment.count({
            where: whereCondition
        });

        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });

    } catch (error) {
        logger.error('Error in getPaymentHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'historique'
        });
    }
};

// ================================
// FONCTIONS UTILITAIRES
// ================================

// Calculer le prix final avec majorations
const calculateFinalPrice = (booking) => {
    const basePrice = parseFloat(booking.estimatedPrice) || 0;
    const distance = parseFloat(booking.estimatedDistance) || 0;
    const duration = parseInt(booking.estimatedDuration) || 0;
    
    // Prix de base selon la distance
    const distancePrice = distance * 2.5; // 2.5€/km
    
    // Prix selon le temps (circulation)
    const timePrice = (duration / 60) * 15; // 15€/heure
    
    // Calcul des majorations
    let surcharge = 0;
    
    // Majoration heures de pointe
    const hour = new Date(booking.scheduledFor).getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        surcharge += basePrice * 0.3; // +30%
    }
    
    // Majoration weekend
    const day = new Date(booking.scheduledFor).getDay();
    if (day === 0 || day === 6) {
        surcharge += basePrice * 0.2; // +20%
    }
    
    // Calcul des réductions (membre premium)
    let discount = 0;
    if (booking.user.membershipTier === 'GOLD') {
        discount = basePrice * 0.05; // -5%
    } else if (booking.user.membershipTier === 'PLATINUM') {
        discount = basePrice * 0.1; // -10%
    } else if (booking.user.membershipTier === 'VIP') {
        discount = basePrice * 0.15; // -15%
    }
    
    const total = Math.max(basePrice + surcharge - discount, 8); // Minimum 8€
    
    return {
        basePrice: Math.round(basePrice * 100) / 100,
        distancePrice: Math.round(distancePrice * 100) / 100,
        timePrice: Math.round(timePrice * 100) / 100,
        surcharge: Math.round(surcharge * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100
    };
};

// Calculer les revenus du chauffeur
const calculateDriverEarnings = async (driverId, payment) => {
    const grossAmount = parseFloat(payment.amount);
    const commission = grossAmount * 0.2; // Commission 20%
    const netAmount = grossAmount - commission;
    
    const today = new Date();
    
    await prisma.earning.create({
        data: {
            driverId,
            grossAmount,
            commission,
            netAmount,
            date: today,
            week: getWeekNumber(today),
            month: today.getMonth() + 1,
            year: today.getFullYear()
        }
    });
    
    // Mettre à jour le total des courses du chauffeur
    await prisma.driver.update({
        where: { id: driverId },
        data: {
            totalRides: { increment: 1 }
        }
    });
};

// Mettre à jour les points de fidélité
const updateLoyaltyPoints = async (userId, amount) => {
    const points = Math.floor(amount); // 1 point par euro
    
    await prisma.user.update({
        where: { id: userId },
        data: {
            loyaltyPoints: { increment: points }
        }
    });
};

// Gérer les événements webhook
const handlePaymentSucceeded = async (paymentIntent) => {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (bookingId) {
        await prisma.payment.updateMany({
            where: {
                bookingId,
                stripePaymentId: paymentIntent.id
            },
            data: {
                status: 'COMPLETED',
                stripeChargeId: paymentIntent.latest_charge,
                paidAt: new Date()
            }
        });
        
        logger.info(`Payment succeeded via webhook for booking ${bookingId}`);
    }
};

const handlePaymentFailed = async (paymentIntent) => {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (bookingId) {
        await prisma.payment.updateMany({
            where: {
                bookingId,
                stripePaymentId: paymentIntent.id
            },
            data: { status: 'FAILED' }
        });
        
        logger.error(`Payment failed via webhook for booking ${bookingId}`);
    }
};

const handleDispute = async (charge) => {
    logger.warn(`Dispute created for charge ${charge.id}`);
    // Logique de gestion des litiges
};

// Utilitaire pour calculer le numéro de semaine
const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    refundPayment,
    getPaymentHistory
};