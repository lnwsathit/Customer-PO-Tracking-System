const pool = require('../config/db');

async function list(req, res) {
    const [rows] = await pool.execute('SELECT * FROM customers ORDER BY created_at DESC');
    res.render('customers/index', { title: 'Customer Management', rows });
}

async function view(req, res) {
    const { id } = req.params;
    const [[row]] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (!row) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'Customer not found.' });
    }

    return res.render('customers/view', { title: 'View Customer', row });
}

async function edit(req, res) {
    const { id } = req.params;
    const [[row]] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
    if (!row) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'Customer not found.' });
    }

    return res.render('customers/edit', { title: 'Edit Customer', row });
}

async function create(req, res) {
    const { name, branch, address, tax_no, contact_person, mobile_phone, email, status } = req.body;
    await pool.execute(
        `INSERT INTO customers (name, branch, address, tax_no, contact_person, mobile_phone, email, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, branch, address, tax_no, contact_person, mobile_phone, email, status || 'active']
    );
    req.flash('success', 'Customer created.');
    res.redirect('/customers');
}

async function update(req, res) {
    const { id } = req.params;
    const { name, branch, address, tax_no, contact_person, mobile_phone, email, status } = req.body;
    await pool.execute(
        `UPDATE customers
     SET name = ?, branch = ?, address = ?, tax_no = ?, contact_person = ?, mobile_phone = ?, email = ?, status = ?
     WHERE id = ?`,
        [name, branch, address, tax_no, contact_person, mobile_phone, email, status, id]
    );
    req.flash('success', 'Customer updated.');
    res.redirect('/customers');
}

async function remove(req, res) {
    const { id } = req.params;
    await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
    req.flash('success', 'Customer deleted.');
    res.redirect('/customers');
}

async function autocomplete(req, res) {
    const keyword = `%${(req.query.q || '').trim()}%`;
    const [rows] = await pool.execute('SELECT id, name FROM customers WHERE name LIKE ? ORDER BY name ASC LIMIT 20', [keyword]);
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
