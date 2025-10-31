const twitterAPI = require('../services/twitterAPI');

exports.getTweetPreview = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract tweet ID from URL
    const tweetId = url.match(/\/status\/(\d+)/)?.[1];
    if (!tweetId) {
      return res.status(400).json({ error: 'Invalid tweet URL format' });
    }

    // Fetch tweet data
    const tweetData = await twitterAPI.fetchTweet(tweetId);

    res.json({
      success: true,
      data: tweetData,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch tweet',
      details: error.message 
    });
  }
};

exports.getTweetById = async (req, res) => {
  try {
    const { tweetId } = req.params;
    const tweetData = await twitterAPI.fetchTweet(tweetId);

    res.json({
      success: true,
      data: tweetData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tweet' });
  }
};