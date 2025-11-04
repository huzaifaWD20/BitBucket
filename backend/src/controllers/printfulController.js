const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { renderTweetImage } = require('../services/imageRenderer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Poll the Printful mockup task until ready
async function pollMockupStatus(taskKey) {
  console.log(`⏳ Polling mockup status for task: ${taskKey}`);

  for (let i = 0; i < 15; i++) { // 45s total
    try {
      const response = await axios.get(
        `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
        {
          headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
        }
      );

      const result = response.data.result;

      if (result.status === 'completed') {
        console.log('✅ Mockup completed!');
        console.log('🖼️ Full mockup response:', JSON.stringify(result, null, 2));
        return result.mockups || [];
      }

      if (result.status === 'failed') {
        throw new Error('Mockup generation failed: ' + (result.error || 'Unknown'));
      }

      console.log(`⌛ Still processing (${i + 1}/15)...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (err) {
      console.error('❌ Error polling mockup:', err.response?.data || err.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error('Timeout: Mockup generation took too long.');
}

exports.createPrintOrder = async (req, res) => {
  // After mockup generation, create actual order
  const orderPayload = {
    recipient: { /* shipping info */ },
    items: [{
      variant_id: 4012,
      quantity: 1,
      files: [{
        url: imageUrl, // your high-res image
        type: 'default'
      }]
    }]
  };
  
  const order = await axios.post(
    'https://api.printful.com/orders',
    orderPayload,
    { headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` }}
  );
  
  // Printful handles 300 DPI conversion internally
};

exports.generateMockupFromTweet = async (req, res) => {
  try {
    const { tweetData } = req.body;
    if (!tweetData) return res.status(400).json({ error: 'tweetData missing in request body' });

    console.log('🖼️ Starting tweet mockup process...');

    // 1️⃣ Render tweet image
    const imagePath = await renderTweetImage(tweetData);
    console.log('✅ Tweet image rendered:', imagePath);

    // 2️⃣ Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: 'printful_tweets',
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      format: 'png',
    });
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    const imageUrl = uploadResult.secure_url;
    console.log('☁️ Uploaded to Cloudinary:', imageUrl);

    // 3️⃣ Upload to Printful file library
    const fileUpload = await axios.post(
      'https://api.printful.com/files',
      { url: imageUrl },
      {
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const fileId = fileUpload.data.result.id;
    console.log('📦 Uploaded to Printful File Library. fileId =', fileId);

    // 4️⃣ Create mockup
    const productId = 71; // Bella + Canvas 3001 Unisex Tee
    const variantId = 4012; // White / M

    const payload = {
      variant_ids: [variantId],
      format: 'jpg',
      technique: 'dtg',
      product_options: { lifelike: true },
      files: [
        {
          placement: 'front',
          url: imageUrl,
          position: {
            area_width: 1800,   // was 1800
            area_height: 2400,  // was 2400
            width: 1800,        // was 1600
            height: 1800,       // was 600
            top: 300,          // was 900
            left: 0,          // was 100
          }
        },
      ],
    };

    console.log('🧩 Creating Printful mockup...');
    const mockupTask = await axios.post(
      `https://api.printful.com/mockup-generator/create-task/${productId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const taskKey = mockupTask.data.result.task_key;
    console.log('✅ Mockup task created:', taskKey);

    // 5️⃣ Poll until ready
    const mockups = await pollMockupStatus(taskKey);

    const mockupUrls = mockups
      .map((m) => m.mockup_url)
      .filter(Boolean);

    console.log('🎨 Final mockups:', mockupUrls);

    res.json({
      success: true,
      message: 'Mockup generated successfully',
      image_uploaded: imageUrl,   // ← This is your high-res PNG!
      printful_file_id: fileId,
      mockup_task: taskKey,
      mockup_urls: mockupUrls,   // ← This is just the preview
    });
  } catch (err) {
    console.error('❌ Mockup generation failed:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Mockup generation failed',
      details: err.response?.data || err.message,
    });
  }
};
