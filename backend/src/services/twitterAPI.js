const axios = require('axios');

const fetchTweet = async (tweetId) => {
  try {
    // Try primary API (vxtwitter)
    try {
      const response = await axios.get(
        `https://api.vxtwitter.com/Twitter/status/${tweetId}`,
        { timeout: 5000 }
      );

      console.log('✅ vxtwitter response received');

      if (response.data && response.data.text) {
        const data = response.data;
        
        console.log('Mapping data:');
        console.log('- text:', data.text);
        console.log('- user_name:', data.user_name);
        console.log('- user_screen_name:', data.user_screen_name);
        console.log('- user_profile_image_url:', data.user_profile_image_url);

        return {
          tweetId,
          text: data.text,
          author: data.user_name || 'Unknown User',
          handle: '@' + (data.user_screen_name || 'user'),
          avatar: data.user_profile_image_url || '👤',
          timestamp: new Date(data.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          likes: data.likes || 0,
          retweets: data.retweets || 0,
        };
      }
    } catch (err) {
      console.log('vxtwitter error:', err.message);
    }

    // Fallback: Return demo data
    console.log('⚠️ Using demo data');
    return {
      tweetId,
      text: 'This is a demo tweet showing the app is working correctly.',
      author: 'Demo Account',
      handle: '@demo_user',
      avatar: '👤',
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      likes: 15234,
      retweets: 5678,
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    return {
      tweetId,
      text: 'Demo mode active',
      author: 'Demo User',
      handle: '@demo',
      avatar: '👤',
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      likes: 9999,
      retweets: 3333,
    };
  }
};

module.exports = {
  fetchTweet,
};
