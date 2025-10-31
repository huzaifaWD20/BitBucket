const express = require('express');
const cors = require('cors');
require('dotenv').config();
const tweetRoutes = require('./routes/tweet');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // or 'https://your-store.myshopify.com'
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Routes
app.use('/api', tweetRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});