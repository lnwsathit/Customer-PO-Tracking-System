const mysql = require('mysql2/promise');
const env = require('../src/config/env');

async function main() {
    const connection = await mysql.createConnection({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database
    });

    try {
        const [duplicates] = await connection.execute(
            `SELECT customer_po_no, COUNT(*) AS total
             FROM po_tracking
             GROUP BY customer_po_no
             HAVING COUNT(*) > 1`
        );

        if (duplicates.length) {
            console.error('Cannot add unique index because duplicate Customer PO No values already exist.');
            duplicates.forEach((row) => {
                console.error(`- ${row.customer_po_no}: ${row.total} records`);
            });
            process.exitCode = 1;
            return;
        }

        const [indexes] = await connection.execute(
            `SELECT INDEX_NAME
             FROM information_schema.statistics
             WHERE table_schema = ? AND table_name = 'po_tracking' AND index_name = 'uq_po_tracking_customer_po_no'`,
            [env.db.database]
        );

        if (indexes.length) {
            console.log('Unique index uq_po_tracking_customer_po_no already exists.');
            return;
        }

        await connection.execute(
            'ALTER TABLE po_tracking ADD CONSTRAINT uq_po_tracking_customer_po_no UNIQUE (customer_po_no)'
        );
        console.log('Unique index uq_po_tracking_customer_po_no created successfully.');
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});