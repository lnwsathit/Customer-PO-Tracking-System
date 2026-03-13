const express = require('express');
const { requireGuest, requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', requireGuest, authController.showLogin);
router.post('/login', requireGuest, authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
