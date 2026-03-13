const pool = require('../config/db');

async function list(req, res) {
    const [rows] = await pool.execute(
        `SELECT bq.*, c.name AS customer_name
     FROM bst_quotations bq
     JOIN customers c ON c.id = bq.bst_customer_id
     ORDER BY bq.created_at DESC`
    );
    const [customers] = await pool.execute('SELECT id, name FROM customers WHERE status = "active" ORDER BY name ASC');
    res.render('quotations/index', { title: 'Quotation Management', rows, customers });
}

async function view(req, res) {
    const { id } = req.params;
    const [[row]] = await pool.execute(
        `SELECT bq.*, c.name AS customer_name
     FROM bst_quotations bq
     JOIN customers c ON c.id = bq.bst_customer_id
     WHERE bq.id = ?`,
        [id]
    );

    if (!row) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'Quotation not found.' });
    }

    return res.render('quotations/view', { title: 'View Quotation', row });
}

async function edit(req, res) {
    const { id } = req.params;
    const [[row]] = await pool.execute('SELECT * FROM bst_quotations WHERE id = ?', [id]);
    const [customers] = await pool.execute('SELECT id, name FROM customers WHERE status = "active" ORDER BY name ASC');

    if (!row) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'Quotation not found.' });
    }

    return res.render('quotations/edit', { title: 'Edit Quotation', row, customers });
}

async function create(req, res) {
    const { bst_quotation_no, bst_customer_id, bst_quotation_date, detail, status } = req.body;
    const filePath = req.file ? req.file.filename : null;
    await pool.execute(
        `INSERT INTO bst_quotations (bst_quotation_no, bst_customer_id, bst_quotation_date, file_path, detail, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [bst_quotation_no, bst_customer_id, bst_quotation_date, filePath, detail, status || 'active']
    );
    req.flash('success', 'Quotation created.');
    res.redirect('/quotations');
}

async function update(req, res) {
    const { id } = req.params;
    const { bst_quotation_no, bst_customer_id, bst_quotation_date, detail, status } = req.body;
    const filePath = req.file ? req.file.filename : null;

    if (filePath) {
        await pool.execute(
            `UPDATE bst_quotations
       SET bst_quotation_no = ?, bst_customer_id = ?, bst_quotation_date = ?, file_path = ?, detail = ?, status = ?
       WHERE id = ?`,
            [bst_quotation_no, bst_customer_id, bst_quotation_date, filePath, detail, status, id]
        );
    } else {
        await pool.execute(
            `UPDATE bst_quotations
       SET bst_quotation_no = ?, bst_customer_id = ?, bst_quotation_date = ?, detail = ?, status = ?
       WHERE id = ?`,
            [bst_quotation_no, bst_customer_id, bst_quotation_date, detail, status, id]
        );
    }

    req.flash('success', 'Quotation updated.');
    res.redirect('/quotations');
}

async function remove(req, res) {
    const { id } = req.params;
    await pool.execute('DELETE FROM bst_quotations WHERE id = ?', [id]);
    req.flash('success', 'Quotation deleted.');
    res.redirect('/quotations');
}

async function autocomplete(req, res) {
    const keyword = `%${(req.query.q || '').trim()}%`;
    const [rows] = await pool.execute(
        'SELECT id, bst_quotation_no FROM bst_quotations WHERE bst_quotation_no LIKE ? ORDER BY bst_quotation_no ASC LIMIT 20',
        [keyword]
    );
    res.json(rows);
}

module.exports = {
    list,
    view,
    edit,
    create,
    update,
    remove,
    autocomplete
};
