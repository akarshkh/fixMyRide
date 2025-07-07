const mongoose = require('mongoose');

// Service Request Schema
const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "Oil Change", 
        "Brake Service", 
        "Engine Repair", 
        "Battery Replacement", 
        "Tire Service", 
        "Chain & Sprocket", 
        "Electrical Repair", 
        "General Maintenance", 
        "Other"
      ],
    },
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to set completedAt when status changes to Completed
serviceRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Virtual for service duration (if completed)
serviceRequestSchema.virtual('serviceDuration').get(function() {
  if (this.completedAt && this.createdAt) {
    const diffInMs = this.completedAt - this.createdAt;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
    } else {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
    }
  }
  return null;
});

// Include virtuals when converting to JSON
serviceRequestSchema.set('toJSON', { virtuals: true });
serviceRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
