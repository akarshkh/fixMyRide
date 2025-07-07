const mongoose = require('mongoose');

// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    lastServiceDate: {
      type: Date,
      default: Date.now,
    },
    totalSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    visitCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add virtual field for customer category
customerSchema.virtual('category').get(function () {
  if (this.visitCount >= 3) {
    return {
      name: 'Frequently Visited',
      badge: 'frequent',
      icon: '⭐',
      color: 'success'
    };
  } else if (this.visitCount === 2) {
    return {
      name: 'Moderately Active',
      badge: 'moderate',
      icon: '🔄',
      color: 'warning'
    };
  } else {
    return {
      name: 'One-Time Visitors',
      badge: 'one-time',
      icon: '🆕',
      color: 'info'
    };
  }
});

// Include virtuals when converting to JSON
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

// Static method to get customers by category
customerSchema.statics.getByCategory = function(category) {
  switch (category) {
    case 'frequent':
      return this.find({ visitCount: { $gte: 3 } });
    case 'moderate':
      return this.find({ visitCount: { $eq: 2 } });
    case 'one-time':
      return this.find({ visitCount: { $eq: 1 } });
    default:
      return this.find({});
  }
};

// Instance method to increment visit count
customerSchema.methods.incrementVisit = function() {
  this.visitCount += 1;
  this.lastServiceDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);
