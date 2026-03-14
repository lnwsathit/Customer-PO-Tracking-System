const pool = require('../config/db');

async function getTimelineDataByTrackingId(id) {
    const [[header]] = await pool.execute(
        `SELECT pt.*, c.name AS customer_name, bq.bst_quotation_no
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     LEFT JOIN bst_quotations bq ON bq.id = pt.bst_customer_id
     WHERE pt.id = ?`,
        [id]
    );

    if (!header) {
        return null;
    }

    const [issued] = await pool.execute('SELECT * FROM issued_po_supplier WHERE po_tracking_id = ? ORDER BY issued_date ASC', [id]);
    const [goods] = await pool.execute('SELECT * FROM goods_receive WHERE po_tracking_id = ? ORDER BY receive_date ASC', [id]);
    const [shipping] = await pool.execute('SELECT * FROM shipping WHERE po_tracking_id = ? ORDER BY shipping_date ASC', [id]);
    const [billing] = await pool.execute('SELECT * FROM billing WHERE po_tracking_id = ? ORDER BY billing_date ASC', [id]);

    return {
        header,
        issued,
        goods,
        shipping,
        billing
    };
}

async function index(req, res) {
    if (req.session) {
        req.session.lastPublicSearchUrl = null;
    }

    res.render('public/index', {
        title: 'Customer PO Tracking - Search',
        results: [],
        q: '',
        hasSearched: false,
        selectedTracking: null
    });
}

async function search(req, res) {
    const { q = '' } = req.query;
    const keyword = `%${q.trim()}%`;

    if (req.session) {
        req.session.lastPublicSearchUrl = req.originalUrl;
    }

    const [results] = await pool.execute(
        `SELECT pt.id, c.name AS customer_name, pt.customer_po_no, pt.receive_date, pt.status
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     WHERE pt.customer_po_no LIKE ?
     ORDER BY pt.created_at DESC
     LIMIT 100`,
        [keyword]
    );

    let selectedTracking = null;
    if (results.length > 0) {
        selectedTracking = await getTimelineDataByTrackingId(results[0].id);
    }

    res.render('public/index', {
        title: 'Customer PO Tracking - Search',
        results,
        q,
        hasSearched: true,
        selectedTracking
    });
}

async function viewTimeline(req, res) {
    const { id } = req.params;
    const timelineData = await getTimelineDataByTrackingId(id);
    const { header, issued, goods, shipping, billing } = timelineData || {};

    if (!header) {
        return res.status(404).render('partials/error', {
            title: 'Not Found',
            message: 'Tracking record not found.'
        });
    }

    let backUrl = '/';
    if (req.session && req.session.user) {
        backUrl = '/po-tracking';
    } else {
        backUrl = (req.session && req.session.lastPublicSearchUrl) || '/';
    }

    res.render('public/view', {
        title: 'PO Tracking Timeline',
        header,
        issued,
        goods,
        shipping,
        billing,
        backUrl
    });
}

module.exports = {
    index,
    search,
    viewTimeline
};
