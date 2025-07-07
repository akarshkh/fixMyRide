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
  
  // Notification Settings
  emailNotifications: {
    newCustomer: { type: Boolean, default: true },
    newServiceRequest: { type: Boolean, default: true },
    paymentReceived: { type: Boolean, default: true },
    serviceCompleted: { type: Boolean, default: true },
    appointmentReminder: { type: Boolean, default: true }
  },
  
  // Service Settings
  defaultWarrantyPeriod: {
    type: Number,
    default: 30 // days
  },
  
  // Appointment Settings
  workingHours: {
    monday: { start: String, end: String, isOpen: Boolean },
    tuesday: { start: String, end: String, isOpen: Boolean },
    wednesday: { start: String, end: String, isOpen: Boolean },
    thursday: { start: String, end: String, isOpen: Boolean },
    friday: { start: String, end: String, isOpen: Boolean },
    saturday: { start: String, end: String, isOpen: Boolean },
    sunday: { start: String, end: String, isOpen: Boolean }
  },
  
  // System Settings
  theme: {
    type: String,
    default: 'light',
    enum: ['light', 'dark', 'system']
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY',
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
  },
  timeFormat: {
    type: String,
    default: '24h',
    enum: ['12h', '24h']
  },
  
  // Backup Settings
  autoBackup: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    default: 'daily',
    enum: ['daily', 'weekly', 'monthly']
  },
  
  // Security Settings
  sessionTimeout: {
    type: Number,
    default: 30 // minutes
  },
  passwordPolicy: {
    minLength: { type: Number, default: 8 },
    requireUppercase: { type: Boolean, default: true },
    requireNumbers: { type: Boolean, default: true },
    requireSymbols: { type: Boolean, default: false }
  },
  
  // Invoice Settings
  invoicePrefix: {
    type: String,
    default: 'FMR'
  },
  invoiceNumberStart: {
    type: Number,
    default: 1000
  },
  invoiceTerms: {
    type: String,
    default: 'Payment due within 30 days'
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
      monday: { start: '09:00', end: '18:00', isOpen: true },
      tuesday: { start: '09:00', end: '18:00', isOpen: true },
      wednesday: { start: '09:00', end: '18:00', isOpen: true },
      thursday: { start: '09:00', end: '18:00', isOpen: true },
      friday: { start: '09:00', end: '18:00', isOpen: true },
      saturday: { start: '09:00', end: '17:00', isOpen: true },
      sunday: { start: '10:00', end: '16:00', isOpen: false }
    };
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
