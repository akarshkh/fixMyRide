const mongoose = require('mongoose');

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

module.exports = mongoose.model('Settings', settingsSchema);
