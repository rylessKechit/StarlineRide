const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Créer une instance Prisma globale
let prisma;

const connectDB = async () => {
    try {
        if (!prisma) {
            prisma = new PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
                errorFormat: 'pretty',
            });
        }

        // Tester la connexion
        await prisma.$connect();
        
        logger.info('🐘 PostgreSQL Connected successfully with Prisma');
        logger.info(`📊 Database: ${process.env.DATABASE_URL ? 'Remote' : 'Local'}`);

        // Health check
        const result = await prisma.$queryRaw`SELECT version()`;
        logger.info('🟢 Database version:', result[0]?.version?.substring(0, 50) + '...');

        return prisma;

    } catch (error) {
        logger.error('🔴 Database connection failed:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async () => {
    if (prisma) {
        await prisma.$disconnect();
        logger.info('🔹 PostgreSQL connection closed through app termination');
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = { connectDB, prisma: () => prisma };