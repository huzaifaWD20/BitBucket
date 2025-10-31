const express = require('express');
const router = express.Router();
const tweetController = require('../controllers/tweetController');

// Routes
router.post('/tweet/preview', tweetController.getTweetPreview);
router.get('/tweet/:tweetId', tweetController.getTweetById);

module.exports = router;