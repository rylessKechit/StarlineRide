const express = require('express');
const { body, validationResult } = require('express-validator');
const {
    registerUser,
    registerDriver,
    login,
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

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

// Validation inscription utilisateur
const userRegistrationValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
    body('phone')
        .isMobilePhone('fr-FR')
        .withMessage('Numéro de téléphone invalide'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date de naissance invalide')
];

// Validation inscription chauffeur
const driverRegistrationValidation = [
    ...userRegistrationValidation,
    body('licenseNumber')
        .trim()
        .isLength({ min: 5, max: 20 })
        .withMessage('Numéro de licence invalide'),
    body('licenseExpiry')
        .isISO8601()
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('La licence doit être valide');
            }
            return true;
        }),
    body('experience')
        .isInt({ min: 0, max: 50 })
        .withMessage('Expérience invalide'),
    body('languages')
        .optional()
        .isArray()
        .withMessage('Langues invalides'),
    body('dateOfBirth')
        .isISO8601()
        .custom((value) => {
            const age = (new Date() - new Date(value)) / (1000 * 60 * 60 * 24 * 365);
            if (age < 21) {
                throw new Error('Vous devez avoir au moins 21 ans');
            }
            return true;
        })
];

// Validation connexion
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
    body('password')
        .notEmpty()
        .withMessage('Mot de passe requis'),
    body('userType')
        .optional()
        .isIn(['user', 'driver'])
        .withMessage('Type d\'utilisateur invalide')
];

// Validation changement de mot de passe
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mot de passe actuel requis'),
    body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre')
];

// ================================
// ROUTES PUBLIQUES
// ================================

// @route   POST /api/auth/register/user
// @desc    Inscription utilisateur
// @access  Public
router.post('/register/user', userRegistrationValidation, validateRequest, registerUser);

// @route   POST /api/auth/register/driver
// @desc    Inscription chauffeur
// @access  Public
router.post('/register/driver', driverRegistrationValidation, validateRequest, registerDriver);

// @route   POST /api/auth/login
// @desc    Connexion utilisateur/chauffeur
// @access  Public
router.post('/login', loginValidation, validateRequest, login);

// ================================
// ROUTES PROTÉGÉES
// ================================

// @route   GET /api/auth/profile
// @desc    Récupérer profil utilisateur connecté
// @access  Private
router.get('/profile', authenticate, getProfile);

// @route   PUT /api/auth/profile
// @desc    Mettre à jour profil utilisateur connecté
// @access  Private
router.put('/profile', authenticate, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Changer mot de passe
// @access  Private
router.put('/change-password', authenticate, changePasswordValidation, validateRequest, changePassword);

// ================================
// ROUTES UTILITAIRES
// ================================

// @route   POST /api/auth/verify-token
// @desc    Vérifier si le token est valide
// @access  Private
router.post('/verify-token', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Token valide',
        data: {
            userId: req.user.userId,
            userType: req.user.userType,
            email: req.user.email
        }
    });
});

// @route   POST /api/auth/refresh-token
// @desc    Rafraîchir le token (pour l'instant, retourne le même)
// @access  Private
router.post('/refresh-token', authenticate, (req, res) => {
    const jwt = require('jsonwebtoken');
    
    const newToken = jwt.sign(
        { 
            id: req.user.userId, 
            userType: req.user.userType 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
        success: true,
        message: 'Token rafraîchi',
        data: { token: newToken }
    });
});

module.exports = router;