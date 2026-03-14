const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const dashboardController = require('../controllers/dashboardController');
const customerController = require('../controllers/customerController');
const quotationController = require('../controllers/quotationController');
const poTrackingController = require('../controllers/poTrackingController');
const userController = require('../controllers/userController');
const { uploadPdf } = require('../utils/fileUpload');

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', dashboardController.index);

router.get('/po-tracking', poTrackingController.list);
router.get('/po-tracking/create', poTrackingController.showCreate);
router.post('/po-tracking', uploadPdf.single('customer_po_file'), poTrackingController.create);
router.get('/po-tracking/:id/view', poTrackingController.view);
router.get('/po-tracking/:id/edit', poTrackingController.showEdit);
router.post('/po-tracking/:id/header', uploadPdf.single('customer_po_file'), poTrackingController.updateHeader);
router.post('/po-tracking/:id/issued', uploadPdf.any(), poTrackingController.addIssued);
router.post('/po-tracking/:id/goods', uploadPdf.any(), poTrackingController.addGoodsReceive);
router.post('/po-tracking/:id/shipping', poTrackingController.addShipping);
router.post('/po-tracking/:id/billing', uploadPdf.any(), poTrackingController.addBilling);
router.post('/po-tracking/:id/complete', poTrackingController.complete);
router.post('/po-tracking/:id/issued/:itemId/delete', poTrackingController.removeIssued);
router.post('/po-tracking/:id/goods/:itemId/delete', poTrackingController.removeGoods);
router.post('/po-tracking/:id/shipping/:itemId/delete', poTrackingController.removeShipping);
router.post('/po-tracking/:id/billing/:itemId/delete', poTrackingController.removeBilling);
router.post('/po-tracking/:id/delete', requireRole(['system_admin']), poTrackingController.remove);

router.get('/customers', requireRole(['data_manager', 'system_admin']), customerController.list);
router.get('/customers/:id/view', requireRole(['data_manager', 'system_admin']), customerController.view);
router.get('/customers/:id/edit', requireRole(['data_manager', 'system_admin']), customerController.edit);
router.post('/customers', requireRole(['data_manager', 'system_admin']), customerController.create);
router.post('/customers/:id/update', requireRole(['data_manager', 'system_admin']), customerController.update);
router.post('/customers/:id/delete', requireRole(['data_manager', 'system_admin']), customerController.remove);

router.get('/quotations', requireRole(['data_manager', 'system_admin']), quotationController.list);
router.get('/quotations/:id/view', requireRole(['data_manager', 'system_admin']), quotationController.view);
router.get('/quotations/:id/edit', requireRole(['data_manager', 'system_admin']), quotationController.edit);
router.post('/quotations', requireRole(['data_manager', 'system_admin']), uploadPdf.single('quotation_file'), quotationController.create);
router.post('/quotations/:id/update', requireRole(['data_manager', 'system_admin']), uploadPdf.single('quotation_file'), quotationController.update);
router.post('/quotations/:id/delete', requireRole(['data_manager', 'system_admin']), quotationController.remove);

router.get('/users', requireRole(['system_admin']), userController.list);
router.get('/users/:id/view', requireRole(['system_admin']), userController.view);
router.get('/users/:id/edit', requireRole(['system_admin']), userController.edit);
router.post('/users', requireRole(['system_admin']), userController.create);
router.post('/users/:id/update', requireRole(['system_admin']), userController.update);
router.post('/users/:id/delete', requireRole(['system_admin']), userController.remove);

router.get('/api/customers/autocomplete', requireAuth, customerController.autocomplete);
router.get('/api/quotations/autocomplete', requireAuth, quotationController.autocomplete);
router.get('/api/po-tracking/customer-po-availability', requireAuth, poTrackingController.checkCustomerPoAvailability);

module.exports = router;
