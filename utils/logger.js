const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/security.log'),
            level: 'warn'
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log')
        })
    ]
});

// Log các sự kiện bảo mật
const securityLog = (type, data) => {
    logger.warn({
        type,
        ...data,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    logger,
    securityLog
}; 