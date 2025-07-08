// Standalone server for easier deployment
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://fix-my-ride-bfo2azv8q-khandelwalakarshak-5961s-projects.vercel.app', /\.vercel\.app$/],
  credentials: true
}));
app.use(express.json());

// Simple health check
app.get('/', (req, res) => {
  res.json({
    status: "OK",
    message: "Fix My Ride Backend API (Standalone)",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    message: "Fix My Ride Backend API Health Check",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Mock auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  // Mock authentication - replace with real auth when MongoDB is available
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login successful',
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        username: 'admin',
        name: 'Administrator',
        role: 'admin',
        email: 'admin@fixmyride.com'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Standalone server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Test login: POST /api/auth/login with admin/admin123`);
  });
}

module.exports = app;
