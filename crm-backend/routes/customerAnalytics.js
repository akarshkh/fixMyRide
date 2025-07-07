const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const ServiceRequest = require('../models/ServiceRequest');
const CustomerFeedback = require('../models/CustomerFeedback');
const { authenticateToken } = require('../middleware/auth');

// GET /api/customer-analytics/lifetime-value - Get customer lifetime value calculations
router.get('/lifetime-value', authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: 'servicerequests',
          localField: '_id',
          foreignField: 'customerId',
          as: 'serviceRequests'
        }
      },
      {
        $addFields: {
          lifetimeValue: { $sum: '$serviceRequests.cost' },
          totalServices: { $size: '$serviceRequests' },
          averageServiceValue: {
            $cond: {
              if: { $gt: [{ $size: '$serviceRequests' }, 0] },
              then: { $divide: [{ $sum: '$serviceRequests.cost' }, { $size: '$serviceRequests' }] },
              else: 0
            }
          },
          lastServiceDate: { $max: '$serviceRequests.createdAt' },
          firstServiceDate: { $min: '$serviceRequests.createdAt' }
        }
      },
      {
        $addFields: {
          customerLifespan: {
            $cond: {
              if: { $and: [{ $ne: ['$firstServiceDate', null] }, { $ne: ['$lastServiceDate', null] }] },
              then: {
                $divide: [
                  { $subtract: ['$lastServiceDate', '$firstServiceDate'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { lifetimeValue: -1 }
      },
      {
        $limit: 100
      }
    ]);

    const analytics = await Customer.aggregate([
      {
        $lookup: {
          from: 'servicerequests',
          localField: '_id',
          foreignField: 'customerId',
          as: 'serviceRequests'
        }
      },
      {
        $addFields: {
          lifetimeValue: { $sum: '$serviceRequests.cost' },
          totalServices: { $size: '$serviceRequests' }
        }
      },
      {
        $group: {
          _id: null,
          avgLifetimeValue: { $avg: '$lifetimeValue' },
          totalCustomers: { $sum: 1 },
          highValueCustomers: {
            $sum: { $cond: [{ $gte: ['$lifetimeValue', 10000] }, 1, 0] }
          },
          mediumValueCustomers: {
            $sum: { $cond: [{ $and: [{ $gte: ['$lifetimeValue', 5000] }, { $lt: ['$lifetimeValue', 10000] }] }, 1, 0] }
          },
          lowValueCustomers: {
            $sum: { $cond: [{ $lt: ['$lifetimeValue', 5000] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      customers,
      analytics: analytics[0] || {
        avgLifetimeValue: 0,
        totalCustomers: 0,
        highValueCustomers: 0,
        mediumValueCustomers: 0,
        lowValueCustomers: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customer-analytics/visit-trends - Get visit frequency trends
router.get('/visit-trends', authenticateToken, async (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    let dateFilter;
    const now = new Date();
    
    switch (period) {
      case '3months':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '1year':
        dateFilter = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        dateFilter = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    const visitTrends = await ServiceRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalVisits: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customerId' },
          totalRevenue: { $sum: '$cost' }
        }
      },
      {
        $addFields: {
          uniqueCustomerCount: { $size: '$uniqueCustomers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedTrends = visitTrends.map(trend => ({
      month: monthNames[trend._id.month - 1],
      year: trend._id.year,
      totalVisits: trend.totalVisits,
      uniqueCustomers: trend.uniqueCustomerCount,
      totalRevenue: trend.totalRevenue,
      avgRevenuePerVisit: trend.totalVisits > 0 ? trend.totalRevenue / trend.totalVisits : 0
    }));

    res.json(formattedTrends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customer-analytics/:id/history - Get complete service history for a customer
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const serviceHistory = await ServiceRequest.find({ customerId })
      .populate('createdBy', 'name username')
      .populate('assignedTo', 'name username')
      .sort({ createdAt: -1 });

    const feedback = await CustomerFeedback.find({ customerId })
      .populate('serviceRequestId', 'serviceType createdAt')
      .sort({ createdAt: -1 });

    // Calculate customer analytics
    const analytics = {
      totalServices: serviceHistory.length,
      totalSpent: serviceHistory.reduce((sum, service) => sum + (service.cost || 0), 0),
      avgServiceCost: serviceHistory.length > 0 ? serviceHistory.reduce((sum, service) => sum + (service.cost || 0), 0) / serviceHistory.length : 0,
      preferredServiceTypes: {}
    };

    // Calculate preferred service types
    serviceHistory.forEach(service => {
      analytics.preferredServiceTypes[service.serviceType] = 
        (analytics.preferredServiceTypes[service.serviceType] || 0) + 1;
    });

    res.json({
      customer,
      serviceHistory,
      feedback,
      analytics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customer-analytics/feedback - Add customer feedback
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const feedbackData = {
      ...req.body,
      createdBy: req.user.id
    };

    const feedback = new CustomerFeedback(feedbackData);
    const savedFeedback = await feedback.save();
    
    const populatedFeedback = await CustomerFeedback.findById(savedFeedback._id)
      .populate('customerId', 'name phone')
      .populate('serviceRequestId', 'serviceType vehicle createdAt')
      .populate('createdBy', 'name username');

    res.status(201).json(populatedFeedback);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/customer-analytics/feedback/:serviceRequestId - Get feedback for a service request
router.get('/feedback/:serviceRequestId', authenticateToken, async (req, res) => {
  try {
    const feedback = await CustomerFeedback.findOne({ 
      serviceRequestId: req.params.serviceRequestId 
    })
      .populate('customerId', 'name phone')
      .populate('serviceRequestId', 'serviceType vehicle createdAt')
      .populate('createdBy', 'name username');

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
