const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/settings - Get current settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Find settings or create default ones
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
});

// PUT /api/settings - Update settings (admin only)
router.put('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
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
    
    // Find settings or create default ones
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(updates);
    } else {
      // Update existing settings
      Object.assign(settings, updates);
    }
    
    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
});

// GET /api/settings/business - Get business info (public)
router.get('/business', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.json({
        success: true,
        data: {
          businessName: 'Fix My Ride',
          businessPhone: '',
          businessEmail: '',
          businessAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          }
        }
      });
    }

    // Return only public business information
    res.json({
      success: true,
      data: {
        businessName: settings.businessName,
        businessPhone: settings.businessPhone,
        businessEmail: settings.businessEmail,
        businessAddress: settings.businessAddress,
        businessWebsite: settings.businessWebsite,
        workingHours: settings.workingHours
      }
    });
  } catch (error) {
    console.error('Error fetching business info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching business information'
    });
  }
});

// PUT /api/settings/business - Update business info (admin only)
router.put('/business', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { businessName, businessPhone, businessEmail, businessAddress, businessWebsite, workingHours } = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    // Update business information
    if (businessName !== undefined) settings.businessName = businessName;
    if (businessPhone !== undefined) settings.businessPhone = businessPhone;
    if (businessEmail !== undefined) settings.businessEmail = businessEmail;
    if (businessAddress !== undefined) settings.businessAddress = businessAddress;
    if (businessWebsite !== undefined) settings.businessWebsite = businessWebsite;
    if (workingHours !== undefined) settings.workingHours = workingHours;
    
    await settings.save();

    res.json({
      success: true,
      message: 'Business information updated successfully',
      data: {
        businessName: settings.businessName,
        businessPhone: settings.businessPhone,
        businessEmail: settings.businessEmail,
        businessAddress: settings.businessAddress,
        businessWebsite: settings.businessWebsite,
        workingHours: settings.workingHours
      }
    });
  } catch (error) {
    console.error('Error updating business info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating business information'
    });
  }
});

// PUT /api/settings/notifications - Update notification settings
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    if (emailNotifications !== undefined) {
      settings.emailNotifications = { ...settings.emailNotifications, ...emailNotifications };
    }
    
    await settings.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        emailNotifications: settings.emailNotifications
      }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification settings'
    });
  }
});

// PUT /api/settings/system - Update system settings (admin only)
router.put('/system', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { theme, dateFormat, timeFormat, sessionTimeout, passwordPolicy } = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }
    
    // Update system settings
    if (theme !== undefined) settings.theme = theme;
    if (dateFormat !== undefined) settings.dateFormat = dateFormat;
    if (timeFormat !== undefined) settings.timeFormat = timeFormat;
    if (sessionTimeout !== undefined) settings.sessionTimeout = sessionTimeout;
    if (passwordPolicy !== undefined) settings.passwordPolicy = { ...settings.passwordPolicy, ...passwordPolicy };
    
    await settings.save();

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: {
        theme: settings.theme,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        sessionTimeout: settings.sessionTimeout,
        passwordPolicy: settings.passwordPolicy
      }
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating system settings'
    });
  }
});

module.exports = router;
