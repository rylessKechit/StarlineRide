const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ================================
// MIDDLEWARE D'AUTHENTIFICATION
// ================================
const authenticate = async (req, res, next) => {
    try {
        let token;

        // Récupérer le token depuis les headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant'
            });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur selon son type
        let user;
        if (decoded.userType === 'driver') {
            user = await prisma.driver.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                    status: true
                }
            });
        } else {
            user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                    membershipTier: true
                }
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Ajouter les infos utilisateur à la requête
        req.user = {
            userId: user.id,
            userType: decoded.userType,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            ...user
        };

        next();

    } catch (error) {
        logger.error('Authentication error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur d\'authentification'
        });
    }
};

// ================================
// MIDDLEWARE POUR UTILISATEURS SEULEMENT
// ================================
const authenticateUser = async (req, res, next) => {
    await authenticate(req, res, () => {
        if (req.user.userType !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux clients'
            });
        }
        next();
    });
};

// ================================
// MIDDLEWARE POUR CHAUFFEURS SEULEMENT
// ================================
const authenticateDriver = async (req, res, next) => {
    await authenticate(req, res, () => {
        if (req.user.userType !== 'driver') {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux chauffeurs'
            });
        }
        next();
    });
};

// ================================
// MIDDLEWARE POUR ADMIN SEULEMENT
// ================================
const authenticateAdmin = async (req, res, next) => {
    await authenticate(req, res, () => {
        // Pour l'instant, on peut créer un champ isAdmin dans User
        // Ou créer une table Admin séparée
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Accès réservé aux administrateurs'
            });
        }
        next();
    });
};

// ================================
// MIDDLEWARE OPTIONNEL (pour routes publiques avec info user si connecté)
// ================================
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            let user;
            if (decoded.userType === 'driver') {
                user = await prisma.driver.findUnique({
                    where: { id: decoded.id },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        isActive: true
                    }
                });
            } else {
                user = await prisma.user.findUnique({
                    where: { id: decoded.id },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        isActive: true
                    }
                });
            }

            if (user && user.isActive) {
                req.user = {
                    userId: user.id,
                    userType: decoded.userType,
                    ...user
                };
            }
        }

        next();

    } catch (error) {
        // En cas d'erreur, on continue sans utilisateur connecté
        next();
    }
};

module.exports = {
    authenticate,
    authenticateUser,
    authenticateDriver,
    authenticateAdmin,
    optionalAuth
};