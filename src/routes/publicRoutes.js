const express = require('express');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/', publicController.index);
router.get('/search', publicController.search);
router.get('/tracking/:id', publicController.viewTimeline);

module.exports = router;
