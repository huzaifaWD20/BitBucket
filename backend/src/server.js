const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tweetRoutes = require('./routes/tweet');
const printfulRoutes = require('./routes/printful');

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// Routes
app.use('/api', tweetRoutes);
app.use('/api', printfulRoutes);

app.get('/health', (req, res) => res.json({ status: 'Server is running' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
