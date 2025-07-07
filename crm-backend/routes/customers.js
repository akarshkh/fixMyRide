const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const ServiceRequest = require('../models/ServiceRequest');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/customers - Get customers with filtering and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter, search, page = 1, limit = 50 } = req.query;
    let query = {};
    
    // Apply search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply visit count filter if provided
    switch (filter) {
      case 'frequent':
        query.visitCount = { $gte: 3 };
        break;
      case 'moderate':
        query.visitCount = { $eq: 2 };
        break;
      case 'one-time':
        query.visitCount = { $eq: 1 };
        break;
      default:
        // No additional filter
        break;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const customers = await Customer.find(query)
      .populate("createdBy", "name username")
      .sort({ visitCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCustomers = await Customer.countDocuments(query);
    
    // For backward compatibility, return just the customers array
    // The frontend expects a direct array, not a paginated object
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/analytics - Get customer analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const analytics = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          frequentCustomers: {
            $sum: { $cond: [{ $gte: ["$visitCount", 3] }, 1, 0] }
          },
          moderateCustomers: {
            $sum: { $cond: [{ $eq: ["$visitCount", 2] }, 1, 0] }
          },
          oneTimeCustomers: {
            $sum: { $cond: [{ $eq: ["$visitCount", 1] }, 1, 0] }
          },
          averageVisitCount: { $avg: "$visitCount" },
          totalRevenue: { $sum: "$totalSpend" }
        }
      }
    ]);

    // Get top customers by visit count
    const topCustomers = await Customer.find()
      .sort({ visitCount: -1, totalSpend: -1 })
      .limit(5)
      .select('name phone visitCount totalSpend lastServiceDate');

    const result = analytics.length > 0 ? analytics[0] : {
      totalCustomers: 0,
      frequentCustomers: 0,
      moderateCustomers: 0,
      oneTimeCustomers: 0,
      averageVisitCount: 0,
      totalRevenue: 0
    };

    res.json({
      ...result,
      topCustomers,
      categoryBreakdown: {
        frequent: result.frequentCustomers,
        moderate: result.moderateCustomers,
        oneTime: result.oneTimeCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/categories - Get customers grouped by category
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const frequentCustomers = await Customer.getByCategory('frequent')
      .populate('createdBy', 'name username')
      .sort({ visitCount: -1 });
    
    const moderateCustomers = await Customer.getByCategory('moderate')
      .populate('createdBy', 'name username')
      .sort({ visitCount: -1 });
    
    const oneTimeCustomers = await Customer.getByCategory('one-time')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.json({
      frequent: frequentCustomers,
      moderate: moderateCustomers,
      oneTime: oneTimeCustomers,
      summary: {
        frequent: frequentCustomers.length,
        moderate: moderateCustomers.length,
        oneTime: oneTimeCustomers.length,
        total: frequentCustomers.length + moderateCustomers.length + oneTimeCustomers.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers - Create customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.user.id,
    };
    const customer = new Customer(customerData);
    const savedCustomer = await customer.save();
    const populatedCustomer = await Customer.findById(savedCustomer._id)
      .populate("createdBy", "name username");
    res.status(201).json(populatedCustomer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/customers/:id - Get single customer
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate("createdBy", "name username");
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name username");
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/customers/:id - Delete customer (Admin and Manager only)
router.delete('/:id', authenticateToken, async (req, res) => {
  // Check for admin or manager role
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied. Only Admin or Manager can delete customers.',
      requiredRoles: ['admin', 'manager'],
      userRole: req.user.role
    });
  }
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id/visits - Get customer visit history
router.get('/:id/visits', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get all service requests for this customer
    const visits = await ServiceRequest.find({
      $or: [
        { customerId: req.params.id },
        { 
          customerName: customer.name,
          customerPhone: customer.phone
        }
      ]
    })
    .populate("createdBy", "name username")
    .populate("assignedTo", "name username")
    .sort({ createdAt: -1 });

    // Calculate customer statistics
    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'Completed').length;
    const pendingVisits = visits.filter(v => v.status === 'Pending').length;
    const inProgressVisits = visits.filter(v => v.status === 'In Progress').length;
    const totalSpent = visits
      .filter(v => v.status === 'Completed')
      .reduce((sum, v) => sum + (v.cost || 0), 0);

    res.json({
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        vehicleModel: customer.vehicleModel,
        visitCount: customer.visitCount,
        category: customer.category
      },
      statistics: {
        totalVisits,
        completedVisits,
        pendingVisits,
        inProgressVisits,
        totalSpent
      },
      visits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers/:id/increment-visit - Manually increment visit count
router.post('/:id/increment-visit', authenticateToken, async (req, res) => {
  // Check for staff role
  if (req.user.role !== 'staff') {
    return res.status(403).json({ 
      error: 'Access denied. Only Staff members can increment visit counts.',
      requiredRole: 'staff',
      userRole: req.user.role
    });
  }
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await customer.incrementVisit();
    const updatedCustomer = await Customer.findById(req.params.id)
      .populate("createdBy", "name username");

    res.json({
      message: "Visit count incremented successfully",
      customer: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
