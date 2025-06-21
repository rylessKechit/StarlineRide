const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Générer JWT Token
const generateToken = (id, userType = 'user') => {
    return jwt.sign(
        { id, userType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// ================================
// INSCRIPTION CLIENT
// ================================
const registerUser = async (req, res) => {
    try {
        const { email, phone, firstName, lastName, password, dateOfBirth } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Un utilisateur avec cet email ou téléphone existe déjà'
            });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer l'utilisateur
        const user = await prisma.user.create({
            data: {
                email,
                phone,
                firstName,
                lastName,
                password: hashedPassword,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                membershipTier: true,
                loyaltyPoints: true,
                createdAt: true
            }
        });

        // Générer le token
        const token = generateToken(user.id, 'user');

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            data: {
                user,
                token
            }
        });

    } catch (error) {
        logger.error('Error in registerUser:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du compte'
        });
    }
};

// ================================
// INSCRIPTION CHAUFFEUR
// ================================
const registerDriver = async (req, res) => {
    try {
        const {
            email,
            phone,
            firstName,
            lastName,
            password,
            dateOfBirth,
            licenseNumber,
            licenseExpiry,
            experience,
            languages = ['fr']
        } = req.body;

        // Vérifier si le chauffeur existe déjà
        const existingDriver = await prisma.driver.findFirst({
            where: {
                OR: [
                    { email },
                    { phone },
                    { licenseNumber }
                ]
            }
        });

        if (existingDriver) {
            return res.status(400).json({
                success: false,
                message: 'Un chauffeur avec ces informations existe déjà'
            });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer le chauffeur
        const driver = await prisma.driver.create({
            data: {
                email,
                phone,
                firstName,
                lastName,
                password: hashedPassword,
                dateOfBirth: new Date(dateOfBirth),
                licenseNumber,
                licenseExpiry: new Date(licenseExpiry),
                experience: parseInt(experience),
                languages
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                licenseNumber: true,
                experience: true,
                languages: true,
                rating: true,
                status: true,
                createdAt: true
            }
        });

        // Générer le token
        const token = generateToken(driver.id, 'driver');

        logger.info(`New driver registered: ${driver.email}`);

        res.status(201).json({
            success: true,
            message: 'Compte chauffeur créé avec succès. En attente de validation.',
            data: {
                driver,
                token
            }
        });

    } catch (error) {
        logger.error('Error in registerDriver:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du compte chauffeur'
        });
    }
};

// ================================
// CONNEXION UNIVERSELLE
// ================================
const login = async (req, res) => {
    try {
        const { email, password, userType = 'user' } = req.body;

        let user;
        let tableName;

        // Chercher dans la table appropriée
        if (userType === 'driver') {
            user = await prisma.driver.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    password: true,
                    isActive: true,
                    status: true,
                    rating: true,
                    totalRides: true
                }
            });
            tableName = 'driver';
        } else {
            user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    password: true,
                    isActive: true,
                    membershipTier: true,
                    loyaltyPoints: true
                }
            });
            tableName = 'user';
        }

        // Vérifier si l'utilisateur existe
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier si le compte est actif
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé. Contactez le support.'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Supprimer le mot de passe de la réponse
        delete user.password;

        // Générer le token
        const token = generateToken(user.id, userType);

        logger.info(`${tableName} login successful: ${user.email}`);

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user,
                token,
                userType
            }
        });

    } catch (error) {
        logger.error('Error in login:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion'
        });
    }
};

// ================================
// RÉCUPÉRER PROFIL UTILISATEUR
// ================================
const getProfile = async (req, res) => {
    try {
        const { userId, userType } = req.user;

        let profile;

        if (userType === 'driver') {
            profile = await prisma.driver.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    licenseNumber: true,
                    experience: true,
                    languages: true,
                    rating: true,
                    totalRides: true,
                    status: true,
                    isOnline: true,
                    vehicles: {
                        select: {
                            id: true,
                            brand: true,
                            model: true,
                            category: true,
                            isActive: true
                        }
                    },
                    createdAt: true
                }
            });
        } else {
            profile = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    membershipTier: true,
                    loyaltyPoints: true,
                    language: true,
                    currency: true,
                    addresses: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            isDefault: true
                        }
                    },
                    createdAt: true
                }
            });
        }

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profil non trouvé'
            });
        }

        res.json({
            success: true,
            data: { profile }
        });

    } catch (error) {
        logger.error('Error in getProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du profil'
        });
    }
};

// ================================
// METTRE À JOUR PROFIL
// ================================
const updateProfile = async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const updateData = req.body;

        // Supprimer les champs sensibles
        delete updateData.password;
        delete updateData.email;
        delete updateData.id;

        let updatedProfile;

        if (userType === 'driver') {
            updatedProfile = await prisma.driver.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    avatar: true,
                    languages: true,
                    updatedAt: true
                }
            });
        } else {
            updatedProfile = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    avatar: true,
                    language: true,
                    currency: true,
                    updatedAt: true
                }
            });
        }

        logger.info(`Profile updated for ${userType}: ${userId}`);

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: { profile: updatedProfile }
        });

    } catch (error) {
        logger.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du profil'
        });
    }
};

// ================================
// CHANGER MOT DE PASSE
// ================================
const changePassword = async (req, res) => {
    try {
        const { userId, userType } = req.user;
        const { currentPassword, newPassword } = req.body;

        // Récupérer l'utilisateur avec son mot de passe
        let user;
        if (userType === 'driver') {
            user = await prisma.driver.findUnique({
                where: { id: userId },
                select: { id: true, password: true }
            });
        } else {
            user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, password: true }
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier l'ancien mot de passe
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hasher le nouveau mot de passe
        const salt = await bcrypt.genSalt(12);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Mettre à jour le mot de passe
        if (userType === 'driver') {
            await prisma.driver.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
        }

        logger.info(`Password changed for ${userType}: ${userId}`);

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        logger.error('Error in changePassword:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de mot de passe'
        });
    }
};

module.exports = {
    registerUser,
    registerDriver,
    login,
    getProfile,
    updateProfile,
    changePassword
};