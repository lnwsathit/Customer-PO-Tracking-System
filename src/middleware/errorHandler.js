function notFound(req, res) {
    res.status(404).render('partials/error', {
        title: '404 Not Found',
        message: 'The requested page was not found.'
    });
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    console.error(`[${req.method} ${req.originalUrl}]`, err);

    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev
        ? `Unexpected error: ${err.message || 'Unknown error'}`
        : 'An unexpected error occurred. Please try again.';

    res.status(500).render('partials/error', {
        title: 'Server Error',
        message
    });
}

module.exports = {
    notFound,
    errorHandler
};
