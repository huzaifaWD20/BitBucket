const nodeHtmlToImage = require('node-html-to-image');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.renderTweetImage = async (tweetData) => {
  const tmpDir = path.join(__dirname, '../../tmp');
  fs.mkdirSync(tmpDir, { recursive: true });

  const outputPath = path.join(tmpDir, `tweet-${tweetData.tweetId}.png`);
  const outputWithDPI = path.join(tmpDir, `tweet-${tweetData.tweetId}-300dpi.png`);

  const html = `
  <html>
    <head>
      <style>
        html, body {
          margin: 0;
          padding: 0;
          background-color: #000;
          color: #fff;
          font-family: 'Arial', sans-serif;
        }
        body {
          display: inline-block;
          padding: 80px;
          border: 4px solid #2f3336;
          border-radius: 40px;
          box-sizing: border-box;
          max-width: 2400px;
        }
        .tweet-header {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
        }
        .tweet-header img {
          width: 192px;
          height: 192px;
          border-radius: 50%;
          margin-right: 40px;
        }
        .tweet-author {
          font-weight: bold;
          font-size: 64px;
        }
        .tweet-handle {
          color: #8b98a5;
          font-size: 56px;
        }
        .tweet-text {
          font-size: 72px;
          margin: 60px 0;
          line-height: 1.5;
          color: #e7e9ea;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .tweet-footer {
          color: #8b98a5;
          font-size: 48px;
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div class="tweet-header">
        <img src="${tweetData.avatar}" />
        <div>
          <div class="tweet-author">${tweetData.author}</div>
          <div class="tweet-handle">${tweetData.handle}</div>
        </div>
      </div>
      <div class="tweet-text">${tweetData.text}</div>
      <div class="tweet-footer">${tweetData.timestamp}</div>
    </body>
  </html>
  `;

  // 🧠 Render high-res tweet image (auto-cropped height)
  await nodeHtmlToImage({
    output: outputPath,
    html,
    puppeteerArgs: {
      defaultViewport: { width: 2400, height: 1200 },
    },
    deviceScaleFactor: 3.125, // ~300 DPI equivalent
    fullPage: true,
  });

  // 🧩 Embed actual 300 DPI metadata into PNG
  await sharp(outputPath)
    .withMetadata({ density: 300 })
    .toFile(outputWithDPI);

  // Return the new file path (with DPI embedded)
  return outputWithDPI;
};
