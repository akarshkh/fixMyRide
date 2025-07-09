const mongoose = require('mongoose');

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
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

// Settings Schema
const settingsSchema = new mongoose.Schema({
  // Business Information
  businessName: {
    type: String,
    default: 'Fix My Ride'
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  businessPhone: String,
  businessEmail: String,
  businessWebsite: String,
  
  // Tax Settings
  taxRate: {
    type: Number,
    default: 18, // GST rate in India
    min: 0,
    max: 100
  },
  taxNumber: String, // GST number
  
  // Currency Settings
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD']
  },
  currencySymbol: {
    type: String,
    default: '₹'
  },
  
  // Service Settings  
  serviceSettings: {
    defaultServiceDuration: {
      type: Number,
      default: 60 // minutes
    },
    allowOnlineBooking: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  
  // Appointment Settings
  workingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  
  // Created/Updated tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Default working hours
settingsSchema.pre('save', function(next) {
  if (this.isNew && !this.workingHours.monday) {
    this.workingHours = {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    };
  }
  this.updatedAt = Date.now();
  next();
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

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
    console.log('✅ MongoDB connected for settings API');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
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
    
    console.log('✅ Settings API - User authenticated:', user.username, 'Role:', user.role);
    
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
      console.log('📝 Settings update request:', JSON.stringify(updates, null, 2));
      
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
      console.log('✅ Settings updated successfully');
      
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
    console.error('❌ Settings API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
