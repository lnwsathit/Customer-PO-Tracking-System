const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');
const env = require('./config/env');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const useMySqlSessionStore = env.sessionStore === 'mysql' || env.nodeEnv === 'production';
let sessionStore = null;
if (useMySqlSessionStore) {
    const MySQLStore = require('express-mysql-session')(session);
    sessionStore = new MySQLStore({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.database,
        createDatabaseTable: true
    });
}

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 200
    })
);

const sessionOptions = {
    key: 'customer-po-tracking.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: env.nodeEnv === 'production'
    }
};

if (sessionStore) {
    sessionOptions.store = sessionStore;
}

app.use(session(sessionOptions));

app.use(flash());

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.flashSuccess = req.flash('success');
    res.locals.flashError = req.flash('error');
    res.locals.selectedTracking = null;
    next();
});

app.use(publicRoutes);
app.use(authRoutes);
app.use(adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
