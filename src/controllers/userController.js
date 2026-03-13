const pool = require('../config/db');
const { hashPassword } = require('../utils/password');

async function list(req, res) {
    const [rows] = await pool.execute('SELECT id, username, name, role, status, created_at FROM users ORDER BY created_at DESC');
    res.render('users/index', { title: 'User Management', rows });
}

async function view(req, res) {
    const { id } = req.params;
    const [[row]] = await pool.execute('SELECT id, username, name, role, status, created_at FROM users WHERE id = ?', [id]);
    if (!row) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'User not found.' });
    }

    return res.render('users/view', { title: 'View User', row });
}

async function edit(req, res) {
    const { id } = req.params;
    const [[row]] = await pool.execute('SELECT id, username, name, role, status FROM users WHERE id = ?', [id]);
    if (!row) {
        return res.status(404).render('partials/error', { title: 'Not Found', message: 'User not found.' });
    }

    return res.render('users/edit', { title: 'Edit User', row });
}

async function create(req, res) {
    const { username, password, name, role, status } = req.body;
    const passwordHash = await hashPassword(password);
    await pool.execute(
        'INSERT INTO users (username, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)',
        [username, passwordHash, name, role, status || 'active']
    );
    req.flash('success', 'User created.');
    res.redirect('/users');
}

async function update(req, res) {
    const { id } = req.params;
    const { username, password, name, role, status } = req.body;

    if (password && password.trim()) {
        const passwordHash = await hashPassword(password);
        await pool.execute(
            'UPDATE users SET username = ?, password_hash = ?, name = ?, role = ?, status = ? WHERE id = ?',
            [username, passwordHash, name, role, status, id]
        );
    } else {
        await pool.execute(
            'UPDATE users SET username = ?, name = ?, role = ?, status = ? WHERE id = ?',
            [username, name, role, status, id]
        );
    }

    req.flash('success', 'User updated.');
    res.redirect('/users');
}

async function remove(req, res) {
    const { id } = req.params;
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    req.flash('success', 'User deleted.');
    res.redirect('/users');
}

module.exports = {
    list,
    view,
    edit,
    create,
    update,
    remove
};
