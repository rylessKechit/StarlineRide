const fs = require('fs');
const path = require('path');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Couleurs pour console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class Logger {
    constructor() {
        this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        this.errorFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    }

    formatTimestamp() {
        return new Date().toISOString();
    }

    writeToFile(filename, message) {
        const logEntry = `[${this.formatTimestamp()}] ${message}\n`;
        fs.appendFileSync(filename, logEntry);
    }

    info(message, ...args) {
        const fullMessage = `${message} ${args.length ? JSON.stringify(args) : ''}`;
        
        // Console avec couleur
        console.log(`${colors.green}[INFO]${colors.reset} ${colors.cyan}${this.formatTimestamp()}${colors.reset} ${fullMessage}`);
        
        // Fichier
        this.writeToFile(this.logFile, `[INFO] ${fullMessage}`);
    }

    error(message, ...args) {
        const fullMessage = `${message} ${args.length ? JSON.stringify(args) : ''}`;
        
        // Console avec couleur
        console.error(`${colors.red}[ERROR]${colors.reset} ${colors.cyan}${this.formatTimestamp()}${colors.reset} ${fullMessage}`);
        
        // Fichiers
        this.writeToFile(this.logFile, `[ERROR] ${fullMessage}`);
        this.writeToFile(this.errorFile, `[ERROR] ${fullMessage}`);
    }

    warn(message, ...args) {
        const fullMessage = `${message} ${args.length ? JSON.stringify(args) : ''}`;
        
        // Console avec couleur
        console.warn(`${colors.yellow}[WARN]${colors.reset} ${colors.cyan}${this.formatTimestamp()}${colors.reset} ${fullMessage}`);
        
        // Fichier
        this.writeToFile(this.logFile, `[WARN] ${fullMessage}`);
    }

    debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            const fullMessage = `${message} ${args.length ? JSON.stringify(args) : ''}`;
            
            // Console avec couleur
            console.log(`${colors.magenta}[DEBUG]${colors.reset} ${colors.cyan}${this.formatTimestamp()}${colors.reset} ${fullMessage}`);
            
            // Fichier
            this.writeToFile(this.logFile, `[DEBUG] ${fullMessage}`);
        }
    }

    success(message, ...args) {
        const fullMessage = `${message} ${args.length ? JSON.stringify(args) : ''}`;
        
        // Console avec couleur
        console.log(`${colors.bright}${colors.green}[SUCCESS]${colors.reset} ${colors.cyan}${this.formatTimestamp()}${colors.reset} ${fullMessage}`);
        
        // Fichier
        this.writeToFile(this.logFile, `[SUCCESS] ${fullMessage}`);
    }

    // Méthode spéciale pour les requêtes HTTP
    request(method, url, statusCode, responseTime) {
        const message = `${method} ${url} ${statusCode} ${responseTime}ms`;
        
        const color = statusCode >= 400 ? colors.red : statusCode >= 300 ? colors.yellow : colors.green;
        console.log(`${color}[HTTP]${colors.reset} ${colors.cyan}${this.formatTimestamp()}${colors.reset} ${message}`);
        
        this.writeToFile(this.logFile, `[HTTP] ${message}`);
    }

    // Nettoyage des anciens logs (garde 30 jours)
    cleanOldLogs() {
        const files = fs.readdirSync(logsDir);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
                this.info(`Deleted old log file: ${file}`);
            }
        });
    }
}

// Créer une instance unique
const logger = new Logger();

// Nettoyer les anciens logs au démarrage
logger.cleanOldLogs();

module.exports = logger;