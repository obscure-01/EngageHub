const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const studentRouter = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Log incoming requests for development debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static frontend assets from /public folder
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/student', studentRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Fallback to landing page for undefined routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` EngageHub MVP Server started on port ${PORT}`);
  console.log(` Local link: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
