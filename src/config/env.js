const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    sessionStore: process.env.SESSION_STORE || 'memory',
    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '12345678',
        database: process.env.DB_NAME || 'customer_po_tracking'
    },
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads')
};
