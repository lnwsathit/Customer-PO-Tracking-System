const pool = require('../config/db');

function toArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (value === undefined || value === null || value === '') {
        return [];
    }

    return [value];
}

function filesByField(files, fieldName) {
    if (!Array.isArray(files)) {
        return [];
    }

    return files.filter((file) => file.fieldname === fieldName).map((file) => file.filename);
}

async function list(req, res) {
    const [rows] = await pool.execute(
        `SELECT pt.*, c.name AS customer_name, bq.bst_quotation_no
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     LEFT JOIN bst_quotations bq ON bq.id = pt.bst_customer_id
     ORDER BY pt.delivery_due_date ASC`
    );

    res.render('po-tracking/index', {
        title: 'PO Tracking Management',
        rows
    });
}

async function showCreate(req, res) {
    const [customers] = await pool.execute('SELECT id, name FROM customers WHERE status = "active" ORDER BY name ASC');
    res.render('po-tracking/create', { title: 'Create PO Tracking', customers });
}

async function create(req, res) {
    const { customer_id, customer_po_no, receive_date, delivery_due_date, bst_customer_id, detail } = req.body;
    const filePath = req.file ? req.file.filename : null;
    const [result] = await pool.execute(
        `INSERT INTO po_tracking
     (customer_id, customer_po_no, customer_po_file_path, receive_date, delivery_due_date, bst_customer_id, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, customer_po_no, filePath, receive_date, delivery_due_date, bst_customer_id || null, detail]
    );

    req.flash('success', 'PO tracking created. You can now add process steps.');
    res.redirect(`/po-tracking/${result.insertId}/edit`);
}

async function showEdit(req, res) {
    const { id } = req.params;
    const [[header]] = await pool.execute('SELECT * FROM po_tracking WHERE id = ?', [id]);
    if (!header) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'Record not found.' });
    }

    const [customers] = await pool.execute('SELECT id, name FROM customers WHERE status = "active" ORDER BY name ASC');
    const [quotations] = await pool.execute(
        'SELECT id, bst_quotation_no FROM bst_quotations WHERE status = "active" ORDER BY bst_quotation_no ASC'
    );
    const [issued] = await pool.execute('SELECT * FROM issued_po_supplier WHERE po_tracking_id = ? ORDER BY issued_date ASC', [id]);
    const [goods] = await pool.execute('SELECT * FROM goods_receive WHERE po_tracking_id = ? ORDER BY receive_date ASC', [id]);
    const [shipping] = await pool.execute('SELECT * FROM shipping WHERE po_tracking_id = ? ORDER BY shipping_date ASC', [id]);
    const [billing] = await pool.execute('SELECT * FROM billing WHERE po_tracking_id = ? ORDER BY billing_date ASC', [id]);

    res.render('po-tracking/edit', {
        title: 'Edit PO Tracking',
        header,
        customers,
        quotations,
        issued,
        goods,
        shipping,
        billing
    });
}

async function updateHeader(req, res) {
    const { id } = req.params;
    const { customer_id, customer_po_no, receive_date, delivery_due_date, bst_customer_id, detail, status } = req.body;
    const filePath = req.file ? req.file.filename : null;

    if (filePath) {
        await pool.execute(
            `UPDATE po_tracking
       SET customer_id = ?, customer_po_no = ?, customer_po_file_path = ?, receive_date = ?, delivery_due_date = ?, bst_customer_id = ?, detail = ?, status = ?
       WHERE id = ?`,
            [customer_id, customer_po_no, filePath, receive_date, delivery_due_date, bst_customer_id || null, detail, status, id]
        );
    } else {
        await pool.execute(
            `UPDATE po_tracking
       SET customer_id = ?, customer_po_no = ?, receive_date = ?, delivery_due_date = ?, bst_customer_id = ?, detail = ?, status = ?
       WHERE id = ?`,
            [customer_id, customer_po_no, receive_date, delivery_due_date, bst_customer_id || null, detail, status, id]
        );
    }

    req.flash('success', 'PO header updated.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function addIssued(req, res) {
    const { id } = req.params;
    const poNos = toArray(req.body.bst_po_no);
    const supplierNames = toArray(req.body.supplier_name);
    const issuedDates = toArray(req.body.issued_date);
    const details = toArray(req.body.detail);
    const uploadedFiles = filesByField(req.files, 'issued_file');

    for (let index = 0; index < poNos.length; index += 1) {
        const poNo = poNos[index];
        const supplierName = supplierNames[index];
        const issuedDate = issuedDates[index];

        if (!poNo || !supplierName || !issuedDate) {
            continue;
        }

        await pool.execute(
            `INSERT INTO issued_po_supplier (po_tracking_id, bst_po_no, supplier_name, issued_date, file_path, detail)
         VALUES (?, ?, ?, ?, ?, ?)`,
            [id, poNo, supplierName, issuedDate, uploadedFiles[index] || null, details[index] || null]
        );
    }

    req.flash('success', 'Issued PO step saved.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function addGoodsReceive(req, res) {
    const { id } = req.params;
    const invoiceNos = toArray(req.body.supplier_invoice_no);
    const supplierNames = toArray(req.body.supplier_name);
    const receiveDates = toArray(req.body.receive_date);
    const details = toArray(req.body.detail);
    const uploadedFiles = filesByField(req.files, 'goods_file');

    for (let index = 0; index < invoiceNos.length; index += 1) {
        const invoiceNo = invoiceNos[index];
        const supplierName = supplierNames[index];
        const receiveDate = receiveDates[index];

        if (!invoiceNo || !supplierName || !receiveDate) {
            continue;
        }

        await pool.execute(
            `INSERT INTO goods_receive (po_tracking_id, supplier_invoice_no, supplier_name, receive_date, file_path, detail)
         VALUES (?, ?, ?, ?, ?, ?)`,
            [id, invoiceNo, supplierName, receiveDate, uploadedFiles[index] || null, details[index] || null]
        );
    }

    req.flash('success', 'Goods receive step saved.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function addShipping(req, res) {
    const { id } = req.params;
    const shippingDates = toArray(req.body.shipping_date);
    const details = toArray(req.body.detail);

    for (let index = 0; index < shippingDates.length; index += 1) {
        const shippingDate = shippingDates[index];
        if (!shippingDate) {
            continue;
        }

        await pool.execute('INSERT INTO shipping (po_tracking_id, shipping_date, detail) VALUES (?, ?, ?)', [
            id,
            shippingDate,
            details[index] || null
        ]);
    }

    req.flash('success', 'Shipping step saved.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function addBilling(req, res) {
    const { id } = req.params;
    const invoiceNos = toArray(req.body.bst_invoice_no);
    const billingDates = toArray(req.body.billing_date);
    const details = toArray(req.body.detail);
    const uploadedFiles = filesByField(req.files, 'billing_file');

    for (let index = 0; index < invoiceNos.length; index += 1) {
        const invoiceNo = invoiceNos[index];
        const billingDate = billingDates[index];

        if (!invoiceNo || !billingDate) {
            continue;
        }

        await pool.execute(
            `INSERT INTO billing (po_tracking_id, bst_invoice_no, billing_date, file_path, detail)
         VALUES (?, ?, ?, ?, ?)`,
            [id, invoiceNo, billingDate, uploadedFiles[index] || null, details[index] || null]
        );
    }

    req.flash('success', 'Billing step saved.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function removeIssued(req, res) {
    const { id, itemId } = req.params;
    await pool.execute('DELETE FROM issued_po_supplier WHERE id = ? AND po_tracking_id = ?', [itemId, id]);
    req.flash('success', 'Issued PO step deleted.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function removeGoods(req, res) {
    const { id, itemId } = req.params;
    await pool.execute('DELETE FROM goods_receive WHERE id = ? AND po_tracking_id = ?', [itemId, id]);
    req.flash('success', 'Goods receive step deleted.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function removeShipping(req, res) {
    const { id, itemId } = req.params;
    await pool.execute('DELETE FROM shipping WHERE id = ? AND po_tracking_id = ?', [itemId, id]);
    req.flash('success', 'Shipping step deleted.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function removeBilling(req, res) {
    const { id, itemId } = req.params;
    await pool.execute('DELETE FROM billing WHERE id = ? AND po_tracking_id = ?', [itemId, id]);
    req.flash('success', 'Billing step deleted.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function complete(req, res) {
    const { id } = req.params;
    await pool.execute(
        `UPDATE po_tracking
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [id]
    );
    req.flash('success', 'PO marked as completed.');
    res.redirect(`/po-tracking/${id}/edit`);
}

async function remove(req, res) {
    const { id } = req.params;
    await pool.execute('DELETE FROM po_tracking WHERE id = ?', [id]);
    req.flash('success', 'PO tracking deleted.');
    res.redirect('/po-tracking');
}

async function view(req, res) {
    const { id } = req.params;
    return res.redirect(`/tracking/${id}`);
}

module.exports = {
    list,
    showCreate,
    create,
    showEdit,
    updateHeader,
    addIssued,
    addGoodsReceive,
    addShipping,
    addBilling,
    removeIssued,
    removeGoods,
    removeShipping,
    removeBilling,
    complete,
    remove,
    view
};
