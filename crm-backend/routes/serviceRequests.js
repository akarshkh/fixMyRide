const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const Customer = require('../models/Customer');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/service-requests - Get all service requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 50 } = req.query;
    let query = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by priority if provided
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const requests = await ServiceRequest.find(query)
      .populate("customerId", "name phone email vehicleModel visitCount")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalRequests = await ServiceRequest.countDocuments(query);
    
    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / parseInt(limit)),
        totalRequests,
        hasNext: skip + requests.length < totalRequests,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/service-requests - Create service request with automatic customer handling
router.post('/', authenticateToken, async (req, res) => {
  // Check for staff role
  if (req.user.role !== 'staff') {
    return res.status(403).json({ 
      error: 'Access denied. Only Staff members can create service requests.',
      requiredRole: 'staff',
      userRole: req.user.role
    });
  }
  try {
    console.log('🔍 DEBUG: Service request received:', JSON.stringify(req.body, null, 2));
    
    const requestData = {
      ...req.body,
      createdBy: req.user.id,
    };
    
    console.log('🔍 DEBUG: Request data after processing:', JSON.stringify(requestData, null, 2));
    
    // Auto-create or update customer based on name and phone
    const { customerName, customerPhone } = requestData;
    
    console.log('🔍 DEBUG: Extracted customer info:', { customerName, customerPhone });
    
    if (customerName && customerPhone) {
      console.log('🔍 DEBUG: Customer name and phone provided, searching for existing customer...');
      
      // Look for existing customer by phone number (primary identifier)
      let customer = await Customer.findOne({
        phone: customerPhone.trim()
      });
      
      console.log('🔍 DEBUG: Customer search result:', customer ? 'Found existing customer' : 'No existing customer found');
      
      if (customer) {
        // Customer exists - increment visit count and update last service date
        const oldVisitCount = customer.visitCount;
        customer.visitCount = (customer.visitCount || 1) + 1;
        customer.lastServiceDate = new Date();
        
        // Update customer name if it's different (in case of minor variations)
        if (customer.name.toLowerCase() !== customerName.trim().toLowerCase()) {
          console.log(`🔄 Updating customer name from "${customer.name}" to "${customerName.trim()}"`);
          customer.name = customerName.trim();
        }
        
        // Update vehicle model if provided and different
        if (requestData.vehicle && customer.vehicleModel !== requestData.vehicle) {
          customer.vehicleModel = requestData.vehicle;
        }
        
        await customer.save();
        console.log(`✅ Updated existing customer: ${customerName} (Visit #${oldVisitCount} → #${customer.visitCount})`);
        
        // Link the service request to the customer
        requestData.customerId = customer._id;
        console.log('🔍 DEBUG: Linked service request to existing customer ID:', customer._id);
      } else {
        // Customer doesn't exist - create new customer
        console.log('🔍 DEBUG: Creating new customer...');
        
        // Generate a default email if not provided
        const defaultEmail = `${customerName.toLowerCase().replace(/\s+/g, '')}@customer.fixmyride.com`;
        
        const newCustomer = new Customer({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: req.body.customerEmail || defaultEmail,
          vehicleModel: requestData.vehicle || 'Unknown Vehicle',
          visitCount: 1,
          lastServiceDate: new Date(),
          createdBy: req.user.id
        });
        
        console.log('🔍 DEBUG: New customer data:', JSON.stringify(newCustomer.toObject(), null, 2));
        
        const savedCustomer = await newCustomer.save();
        console.log(`✅ Created new customer: ${customerName} (First visit) - ID: ${savedCustomer._id}`);
        
        // Link the service request to the new customer
        requestData.customerId = savedCustomer._id;
        console.log('🔍 DEBUG: Linked service request to new customer ID:', savedCustomer._id);
      }
    } else {
      console.log('⚠️ DEBUG: Customer name or phone missing, skipping customer creation/update');
    }
    
    // Create the service request
    const serviceRequest = new ServiceRequest(requestData);
    const savedRequest = await serviceRequest.save();
    
    // Populate the response with related data
    const populatedRequest = await ServiceRequest.findById(savedRequest._id)
      .populate("customerId", "name phone email vehicleModel visitCount")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username");
    
    console.log('✅ Service request created successfully');
    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error("❌ Error creating service request:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/service-requests/:id - Get single service request
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate("customerId", "name phone email vehicleModel visitCount")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username");
    
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/service-requests/:id - Update service request
router.put('/:id', authenticateToken, async (req, res) => {
  // Check for staff role
  if (req.user.role !== 'staff') {
    return res.status(403).json({ 
      error: 'Access denied. Only Staff members can update service requests.',
      requiredRole: 'staff',
      userRole: req.user.role
    });
  }
  try {
    const updates = req.body;
    console.log("Received updates:", updates); // Debugging line
    if (updates.priority) {
      console.log("Updating priority:", updates.priority); // Debugging priority
    }
    
    // If status is being changed to 'Completed', update customer's total spend
    if (updates.status === 'Completed') {
      const existingRequest = await ServiceRequest.findById(req.params.id);
      if (existingRequest && existingRequest.customerId && existingRequest.status !== 'Completed') {
        const customer = await Customer.findById(existingRequest.customerId);
        if (customer) {
          customer.totalSpend = (customer.totalSpend || 0) + (updates.cost || existingRequest.cost || 0);
          await customer.save();
          console.log(`💰 Updated customer ${customer.name} total spend: ₹${customer.totalSpend}`);
        }
      }
    }
    
    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("customerId", "name phone email vehicleModel visitCount")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username");
    
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/service-requests/:id - Delete service request
router.delete('/:id', authenticateToken, async (req, res) => {
  // Check for staff role
  if (req.user.role !== 'staff') {
    return res.status(403).json({ 
      error: 'Access denied. Only Staff members can delete service requests.',
      requiredRole: 'staff',
      userRole: req.user.role
    });
  }
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }
    res.json({ message: "Service request deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/service-requests/analytics/summary - Get service request analytics
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const analytics = await ServiceRequest.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          },
          inProgressRequests: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] }
          },
          completedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          cancelledRequests: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, "$cost", 0] }
          },
          averageServiceCost: { $avg: "$cost" }
        }
      }
    ]);

    // Get recent activities
    const recentActivities = await ServiceRequest.find()
      .populate("customerId", "name")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("customerName vehicle issue status cost updatedAt");

    const result = analytics.length > 0 ? analytics[0] : {
      totalRequests: 0,
      pendingRequests: 0,
      inProgressRequests: 0,
      completedRequests: 0,
      cancelledRequests: 0,
      totalRevenue: 0,
      averageServiceCost: 0
    };

    res.json({
      ...result,
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        customer: activity.customerName || (activity.customerId ? activity.customerId.name : "Unknown"),
        action: `${activity.status} - ${activity.issue.substring(0, 50)}...`,
        time: getTimeAgo(activity.updatedAt),
        vehicle: activity.vehicle,
        cost: activity.cost
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/service-requests/analytics/by-type - Get analytics by service type
router.get('/analytics/by-type', authenticateToken, async (req, res) => {
  try {
    const analytics = await ServiceRequest.aggregate([
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, "$cost", 0] }
          },
          averageCost: { $avg: "$cost" },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(analytics.map(item => ({
      serviceType: item._id,
      totalRequests: item.count,
      completedRequests: item.completedCount,
      totalRevenue: item.totalRevenue,
      averageCost: Math.round(item.averageCost * 100) / 100
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else {
    return "Less than an hour ago";
  }
}

module.exports = router;
