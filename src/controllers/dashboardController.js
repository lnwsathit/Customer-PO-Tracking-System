const pool = require('../config/db');

async function index(req, res) {
    const [[summary]] = await pool.execute(
        `SELECT
      COUNT(*) AS total_receive,
      SUM(CASE WHEN status = 'on_process' THEN 1 ELSE 0 END) AS total_on_process,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS total_completed
     FROM po_tracking`
    );

    const { month = '', year = '', ytd = '' } = req.query;
    const filterMonth = month ? parseInt(month, 10) : null;
    const filterYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const isYtd = ytd === '1';

    let chartQuery, chartParams;
    if (isYtd) {
        const ytdStart = `${filterYear}-01-01`;
        chartQuery = `SELECT c.name, COUNT(*) AS total
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     WHERE pt.receive_date >= ? AND pt.receive_date <= CURDATE()
     GROUP BY c.id, c.name
     ORDER BY total DESC
     LIMIT 20`;
        chartParams = [ytdStart];
    } else if (filterMonth) {
        chartQuery = `SELECT c.name, COUNT(*) AS total
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     WHERE MONTH(pt.receive_date) = ? AND YEAR(pt.receive_date) = ?
     GROUP BY c.id, c.name
     ORDER BY total DESC
     LIMIT 20`;
        chartParams = [filterMonth, filterYear];
    } else {
        chartQuery = `SELECT c.name, COUNT(*) AS total
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     WHERE YEAR(pt.receive_date) = ?
     GROUP BY c.id, c.name
     ORDER BY total DESC
     LIMIT 20`;
        chartParams = [filterYear];
    }

    const [customerChart] = await pool.execute(chartQuery, chartParams);

    const [dueSoon] = await pool.execute(
        `SELECT pt.id, c.name AS customer_name, pt.customer_po_no, pt.delivery_due_date, pt.status,
            DATEDIFF(pt.delivery_due_date, CURDATE()) AS days_remaining
     FROM po_tracking pt
     JOIN customers c ON c.id = pt.customer_id
     WHERE pt.status = 'on_process'
     ORDER BY pt.delivery_due_date ASC
     LIMIT 10`
    );

    res.render('dashboard/index', {
        title: 'Dashboard',
        summary,
        customerChart,
        dueSoon,
        month: filterMonth,
        year: filterYear,
        isYtd
    });
}

module.exports = {
    index
};
