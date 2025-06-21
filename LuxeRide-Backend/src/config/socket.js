const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Store des connexions actives
const activeConnections = new Map();

const setupSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Token manquant'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userType = decoded.userType;
            
            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Token invalide'));
        }
    });

    io.on('connection', (socket) => {
        const { userId, userType } = socket;
        
        logger.info(`${userType} ${userId} connected via socket`);
        
        // Rejoindre une room spécifique à l'utilisateur
        socket.join(`${userType}_${userId}`);
        
        // Stocker la connexion
        activeConnections.set(userId, {
            socketId: socket.id,
            userType,
            connectedAt: new Date()
        });

        // === ÉVÉNEMENTS CHAUFFEUR ===
        if (userType === 'driver') {
            // Le chauffeur s'inscrit pour recevoir des demandes
            socket.on('driver_available', (data) => {
                socket.join('available_drivers');
                logger.info(`Driver ${userId} is now available for rides`);
            });

            // Le chauffeur n'est plus disponible
            socket.on('driver_unavailable', () => {
                socket.leave('available_drivers');
                logger.info(`Driver ${userId} is no longer available`);
            });

            // Mise à jour de position en temps réel
            socket.on('location_update', (locationData) => {
                // Diffuser la position aux clients qui ont une course active
                socket.to(`driver_location_${userId}`).emit('driver_location', {
                    driverId: userId,
                    location: locationData,
                    timestamp: new Date()
                });
            });
        }

        // === ÉVÉNEMENTS CLIENT ===
        if (userType === 'user') {
            // Le client rejoint la room pour suivre son chauffeur
            socket.on('track_driver', (driverId) => {
                socket.join(`driver_location_${driverId}`);
                logger.info(`User ${userId} is tracking driver ${driverId}`);
            });

            // Le client arrête de suivre
            socket.on('stop_tracking', (driverId) => {
                socket.leave(`driver_location_${driverId}`);
            });
        }

        // === ÉVÉNEMENTS COMMUNS ===
        
        // Rejoindre une conversation spécifique (course)
        socket.on('join_ride', (bookingId) => {
            socket.join(`ride_${bookingId}`);
            logger.info(`${userType} ${userId} joined ride ${bookingId}`);
        });

        // Quitter une conversation
        socket.on('leave_ride', (bookingId) => {
            socket.leave(`ride_${bookingId}`);
        });

        // Message dans une course
        socket.on('ride_message', (data) => {
            const { bookingId, message, type } = data;
            
            io.to(`ride_${bookingId}`).emit('new_message', {
                bookingId,
                message,
                type,
                sender: {
                    id: userId,
                    type: userType
                },
                timestamp: new Date()
            });
        });

        // === DÉCONNEXION ===
        socket.on('disconnect', () => {
            logger.info(`${userType} ${userId} disconnected`);
            activeConnections.delete(userId);
            
            if (userType === 'driver') {
                socket.leave('available_drivers');
            }
        });

        // === GESTION D'ERREURS ===
        socket.on('error', (error) => {
            logger.error(`Socket error for ${userType} ${userId}:`, error);
        });
    });

    return io;
};

// Fonctions utilitaires pour envoyer des messages ciblés
const sendToUser = (io, userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
};

const sendToDriver = (io, driverId, event, data) => {
    io.to(`driver_${driverId}`).emit(event, data);
};

const broadcastToAvailableDrivers = (io, event, data) => {
    io.to('available_drivers').emit(event, data);
};

const sendToRide = (io, bookingId, event, data) => {
    io.to(`ride_${bookingId}`).emit(event, data);
};

// Vérifier si un utilisateur est en ligne
const isUserOnline = (userId) => {
    return activeConnections.has(userId);
};

// Récupérer les stats de connexions
const getConnectionStats = () => {
    const stats = {
        total: activeConnections.size,
        users: 0,
        drivers: 0
    };

    activeConnections.forEach(conn => {
        if (conn.userType === 'user') stats.users++;
        if (conn.userType === 'driver') stats.drivers++;
    });

    return stats;
};

module.exports = {
    setupSocket,
    sendToUser,
    sendToDriver,
    broadcastToAvailableDrivers,
    sendToRide,
    isUserOnline,
    getConnectionStats
};