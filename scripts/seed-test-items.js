const mysql = require('mysql2/promise');
const env = require('../src/config/env');

function fmtDate(date) {
    return date.toISOString().slice(0, 10);
}

async function main() {
    const conn = await mysql.createConnection({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database
    });

    try {
        await conn.beginTransaction();

        await conn.execute("DELETE FROM billing WHERE po_tracking_id IN (SELECT id FROM po_tracking WHERE customer_po_no LIKE 'TESTPO-%')");
        await conn.execute("DELETE FROM shipping WHERE po_tracking_id IN (SELECT id FROM po_tracking WHERE customer_po_no LIKE 'TESTPO-%')");
        await conn.execute("DELETE FROM goods_receive WHERE po_tracking_id IN (SELECT id FROM po_tracking WHERE customer_po_no LIKE 'TESTPO-%')");
        await conn.execute("DELETE FROM issued_po_supplier WHERE po_tracking_id IN (SELECT id FROM po_tracking WHERE customer_po_no LIKE 'TESTPO-%')");
        await conn.execute("DELETE FROM po_tracking WHERE customer_po_no LIKE 'TESTPO-%'");
        await conn.execute("DELETE FROM bst_quotations WHERE bst_quotation_no LIKE 'TEST-Q-%'");
        await conn.execute("DELETE FROM customers WHERE name LIKE 'Test Customer %'");

        const customerIds = [];
        for (let index = 1; index <= 10; index += 1) {
            const [result] = await conn.execute(
                `INSERT INTO customers (name, address, tax_no, branch, contact_person, mobile_phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
                [
                    `Test Customer ${index}`,
                    `Address ${index}`,
                    `TAX${String(index).padStart(3, '0')}`,
                    `B${index}`,
                    `Contact ${index}`,
                    `0810000${String(index).padStart(3, '0')}`,
                    `test${index}@example.com`
                ]
            );
            customerIds.push(result.insertId);
        }

        const quotationIds = [];
        for (let index = 1; index <= 10; index += 1) {
            const [result] = await conn.execute(
                `INSERT INTO bst_quotations (bst_quotation_no, bst_customer_id, bst_quotation_date, detail, status)
         VALUES (?, ?, ?, ?, 'active')`,
                [
                    `TEST-Q-${String(index).padStart(3, '0')}`,
                    customerIds[index - 1],
                    '2026-03-01',
                    `Test quotation ${index}`
                ]
            );
            quotationIds.push(result.insertId);
        }

        const baseDate = new Date('2026-03-01T00:00:00Z');
        for (let index = 1; index <= 50; index += 1) {
            const customerId = customerIds[(index - 1) % customerIds.length];
            const quotationId = quotationIds[(index - 1) % quotationIds.length];

            const receiveDate = new Date(baseDate);
            receiveDate.setDate(receiveDate.getDate() + index - 1);

            const dueDate = new Date(receiveDate);
            dueDate.setDate(dueDate.getDate() + 14);

            const [poResult] = await conn.execute(
                `INSERT INTO po_tracking (customer_id, customer_po_no, receive_date, delivery_due_date, bst_customer_id, detail, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    customerId,
                    `TESTPO-${String(index).padStart(3, '0')}`,
                    fmtDate(receiveDate),
                    fmtDate(dueDate),
                    quotationId,
                    `Test PO tracking item ${index}`,
                    index % 5 === 0 ? 'completed' : 'on_process'
                ]
            );

            const poTrackingId = poResult.insertId;

            await conn.execute(
                `INSERT INTO issued_po_supplier (po_tracking_id, bst_po_no, supplier_name, issued_date, detail)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    poTrackingId,
                    `BSTPO-${String(index).padStart(3, '0')}`,
                    `Test Supplier ${(index % 7) + 1}`,
                    fmtDate(receiveDate),
                    `Issued PO for test item ${index}`
                ]
            );

            await conn.execute(
                `INSERT INTO goods_receive (po_tracking_id, supplier_invoice_no, supplier_name, receive_date, detail)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    poTrackingId,
                    `INV-${String(index).padStart(4, '0')}`,
                    `Test Supplier ${(index % 7) + 1}`,
                    fmtDate(dueDate),
                    `Goods receive for test item ${index}`
                ]
            );

            if (index % 3 === 0) {
                await conn.execute(
                    `INSERT INTO shipping (po_tracking_id, shipping_date, detail)
           VALUES (?, ?, ?)`,
                    [poTrackingId, fmtDate(dueDate), `Shipping for test item ${index}`]
                );
            }

            if (index % 4 === 0) {
                await conn.execute(
                    `INSERT INTO billing (po_tracking_id, bst_invoice_no, billing_date, detail)
           VALUES (?, ?, ?, ?)`,
                    [poTrackingId, `BSTINV-${String(index).padStart(4, '0')}`, fmtDate(dueDate), `Billing for test item ${index}`]
                );
            }

            if (index % 5 === 0) {
                await conn.execute(
                    `UPDATE po_tracking SET completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [poTrackingId]
                );
            }
        }

        await conn.commit();

        const [[countRow]] = await conn.execute(
            "SELECT COUNT(*) AS total FROM po_tracking WHERE customer_po_no LIKE 'TESTPO-%'"
        );

        console.log(`TEST_ITEMS_INSERTED=${countRow.total}`);
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        await conn.end();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
