function requireRole(roles = []) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        if (!roles.includes(req.session.user.role)) {
            return res.status(403).render('partials/error', {
                title: 'Forbidden',
                message: 'You do not have permission to access this page.'
            });
        }

        next();
    };
}

module.exports = {
    requireRole
};
