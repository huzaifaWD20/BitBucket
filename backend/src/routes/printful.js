const express = require('express');
const router = express.Router();
const printfulController = require('../controllers/printfulController');

// POST /api/printful/mockup → generates and fetches final mockup
router.post('/printful/mockup', printfulController.generateMockupFromTweet);

module.exports = router;
