const pool = require('../config/db');
const { comparePassword } = require('../utils/password');

async function showLogin(req, res) {
    res.render('auth/login', { title: 'Login' });
}

async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        req.flash('error', 'Username and password are required.');
        return res.redirect('/login');
    }

    const [rows] = await pool.execute(
        'SELECT id, username, password_hash, name, role, status FROM users WHERE username = ? LIMIT 1',
        [username]
    );

    if (!rows.length || rows[0].status !== 'active') {
        req.flash('error', 'Invalid credentials.');
        return res.redirect('/login');
    }

    const user = rows[0];
    const matched = await comparePassword(password, user.password_hash);

    if (!matched) {
        req.flash('error', 'Invalid credentials.');
        return res.redirect('/login');
    }

    req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
    };

    return res.redirect('/dashboard');
}

function logout(req, res) {
    req.session.destroy(() => {
        res.redirect('/login');
    });
}

module.exports = {
    showLogin,
    login,
    logout
};
