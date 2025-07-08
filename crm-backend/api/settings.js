const mongoose = require('mongoose');
const Settings = require('../models/Settings');

// Enable CORS
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
};

// JWT verification middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return null;
  }
  
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'two-wheeler-crm',
      audience: 'crm-users'
    });
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

// MongoDB connection
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/two-wheeler-crm';
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = async (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    // Verify authentication
    const user = verifyToken(req);
    if (!user) {
      console.log('❌ Authentication failed for settings API');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log('✅ Settings API - User authenticated:', user.username);
    
    if (req.method === 'GET') {
      // Get settings
      let settings = await Settings.findOne();
      
      if (!settings) {
        settings = new Settings();
        await settings.save();
      }
      
      return res.json({
        success: true,
        data: settings
      });
    }
    
    if (req.method === 'PUT') {
      // Update settings (admin only)
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      
      const updates = req.body;
      
      // Remove fields that shouldn't be updated directly
      delete updates._id;
      delete updates.__v;
      delete updates.createdAt;
      
      let settings = await Settings.findOne();
      
      if (!settings) {
        settings = new Settings(updates);
      } else {
        Object.assign(settings, updates);
      }
      
      await settings.save();
      
      return res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
