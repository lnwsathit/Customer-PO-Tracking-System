const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');

async function bootstrap() {
    try {
        await pool.query('SELECT 1');
        app.listen(env.port, () => {
            console.log(`Customer PO Tracking System running on port ${env.port}`);
        });
    } catch (error) {
        console.error('Failed to connect to database:', error.message);
        process.exit(1);
    }
}

bootstrap();
