const mongoose = require('mongoose');

// Customer Feedback Schema
const customerFeedbackSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    timelyService: {
      type: Number,
      min: 1,
      max: 5,
    },
    staffBehavior: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
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

// Virtual for overall satisfaction score
customerFeedbackSchema.virtual('overallSatisfaction').get(function() {
  const scores = [this.serviceQuality, this.timelyService, this.staffBehavior, this.valueForMoney].filter(Boolean);
  if (scores.length === 0) return this.rating;
  
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
});

// Include virtuals when converting to JSON
customerFeedbackSchema.set('toJSON', { virtuals: true });
customerFeedbackSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CustomerFeedback', customerFeedbackSchema);
