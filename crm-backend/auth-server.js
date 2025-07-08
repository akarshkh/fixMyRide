// Load environment variables first
require('dotenv').config()

const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const http = require("http")
const socketIo = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://fix-my-ride-bfo2azv8q-khandelwalakarshak-5961s-projects.vercel.app", /\.vercel\.app$/],
    methods: ["GET", "POST"]
  }
})
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://fix-my-ride-bfo2azv8q-khandelwalakarshak-5961s-projects.vercel.app", /\.vercel\.app$/],
    credentials: true,
  }),
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Add detailed request logging middleware
app.use((req, res, next) => {
  console.log(`\n🔍 ${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2))
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('🔍 Query Params:', req.query)
  }
  console.log('👤 Headers:', {
    authorization: req.headers.authorization ? 'Bearer [PRESENT]' : 'None',
    'content-type': req.headers['content-type']
  })
  next()
})

// Root health endpoint for Render
app.get('/', (req, res) => {
  res.json({
    status: "OK",
    message: "Fix My Ride Backend API is running",
    timestamp: new Date().toISOString(),
    environment: "render"
  })
})

// MongoDB Connection with FIXED options
// SECURITY FIX: Use environment variables for sensitive data
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/two-wheeler-crm" // Local fallback

console.log("🔄 Attempting to connect to MongoDB...")
console.log("🔍 Environment check:")
console.log("   NODE_ENV:", process.env.NODE_ENV)
console.log("   PORT:", process.env.PORT)
console.log("   MONGODB_URI present:", !!process.env.MONGODB_URI)
console.log("   JWT_SECRET present:", !!process.env.JWT_SECRET)

// FIXED: Updated MongoDB connection options for Atlas
mongoose.connect(MONGODB_URI, {
  // Atlas-optimized connection options
  serverSelectionTimeoutMS: 30000, // 30 second timeout for Atlas
  socketTimeoutMS: 75000, // 75 second socket timeout
  maxPoolSize: 10, // Maintain up to 10 socket connections
  retryWrites: true,
  w: 'majority'
})

const db = mongoose.connection

db.on("error", (error) => {
  console.error("❌ MongoDB connection error:", error.message)
  console.error("Full error:", error)
})

db.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected")
})

db.on("reconnected", () => {
  console.log("✅ MongoDB reconnected")
})

db.once("open", async () => {
  console.log("✅ Successfully connected to MongoDB Atlas")
  console.log("📊 Database name:", db.name)

  // Test the connection by counting documents
  try {
    const adminCount = await Admin.countDocuments()
    console.log(`📈 Current admin users in database: ${adminCount}`)
  } catch (error) {
    console.error("❌ Error testing database connection:", error.message)
  }
})

// Handle process termination
process.on("SIGINT", async () => {
  await mongoose.connection.close()
  console.log("📴 MongoDB connection closed through app termination")
  process.exit(0)
})

// Admin User Schema
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // Always store in lowercase
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "staff"],
      default: "staff",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Import Models
const Customer = require('./models/Customer');
const ServiceRequest = require('./models/ServiceRequest');


// Inventory Item Schema
const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ["General", "Engine", "Electrical", "Brakes", "Battery", "Tires", "Chain & Sprocket", "Other"],
      default: "General",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Models
const Admin = mongoose.model("Admin", adminSchema)
// Customer and ServiceRequest models are imported from separate files
const InventoryItem = mongoose.model("InventoryItem", inventorySchema)

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    console.log("❌ No token provided")
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(
    token,
    JWT_SECRET,
    {
      issuer: "two-wheeler-crm",
      audience: "crm-users",
    },
    (err, decoded) => {
      if (err) {
        console.log("❌ Token verification failed:", err.message)
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "Token expired. Please login again." })
        } else if (err.name === "JsonWebTokenError") {
          return res.status(403).json({ error: "Invalid token. Please login again." })
        } else {
          return res.status(403).json({ error: "Token verification failed" })
        }
      }

      console.log("✅ Token verified for user:", decoded.username)
      req.user = decoded
      next()
    },
  )
}

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }
    next()
  }
}

// Initialize default admin user (only in development)
const initializeAdmin = async () => {
  // Only create default users in development environment
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Production mode: Skipping default user creation')
    return
  }

  // Check if we should skip seed data based on environment variable
  if (process.env.SKIP_SEED_DATA === 'true') {
    console.log('🔒 SKIP_SEED_DATA is enabled: Skipping default user creation')
    return
  }

  try {
    console.log('🌱 Development mode: Creating default test users...')
    
    const adminExists = await Admin.findOne({ username: "admin" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      const defaultAdmin = new Admin({
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        role: "admin",
        email: "admin@twowheelercrm.com",
      })
      await defaultAdmin.save()
      console.log("✅ Default admin user created (DEV ONLY)")
    }

    const managerExists = await Admin.findOne({ username: "manager" })
    if (!managerExists) {
      const hashedPassword = await bcrypt.hash("manager123", 10)
      const managerUser = new Admin({
        username: "manager",
        password: hashedPassword,
        name: "Service Manager",
        role: "manager",
        email: "manager@twowheelercrm.com",
      })
      await managerUser.save()
      console.log("✅ Default manager user created (DEV ONLY)")
    }

    const staffExists = await Admin.findOne({ username: "staff" })
    if (!staffExists) {
      const hashedPassword = await bcrypt.hash("staff123", 10)
      const staffUser = new Admin({
        username: "staff",
        password: hashedPassword,
        name: "Service Staff",
        role: "staff",
        email: "staff@twowheelercrm.com",
      })
      await staffUser.save()
      console.log("✅ Default staff user created (DEV ONLY)")
    }
  } catch (error) {
    console.error("❌ Error initializing admin users:", error)
  }
}

// Initialize admin users on startup (only in development)
setTimeout(initializeAdmin, 2000) // Wait 2 seconds for DB connection

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Fix My Ride API Server",
    status: "running",
    endpoints: [
      "POST /api/auth/login - User login",
      "GET /api/auth/verify - Verify token",
      "POST /api/admin/create-manager - Create manager (Admin only)",
      "POST /api/admin/create-staff - Create staff (Admin/Manager)",
      "GET /api/customers - Get customers",
      "POST /api/customers - Create customer",
      "GET /api/requests - Get service requests",
      "POST /api/requests - Create service request",
      "GET /api/dashboard/stats - Dashboard statistics",
    ],
  })
})

// Authentication Routes

// PUBLIC SIGNUP REMOVED - Users can only be created by Admin or Manager through role-based endpoints

// Login Route
app.post("/api/auth/login", async (req, res) => {
  console.log("🔐 Login request received")
  console.log("🔐 Username:", req.body.username)

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database connection unavailable. Please try again later.",
      })
    }

    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

    console.log("🔍 Searching for user...")
    // Find user (case insensitive)
    const user = await Admin.findOne({
      username: username.toLowerCase().trim(),
      isActive: true,
    })

    if (!user) {
      console.log("❌ User not found:", username)
      // Debug: Let's also check what users exist in the database
      const allUsers = await Admin.find({}, "username").limit(5)
      console.log(
        "📋 Available users:",
        allUsers.map((u) => u.username),
      )
      return res.status(401).json({ error: "Invalid username or password" })
    }

    console.log("✅ User found:", user.username)
    console.log("🔍 Verifying password...")

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", username)
      return res.status(401).json({ error: "Invalid username or password" })
    }

    console.log("✅ Password verified, updating last login...")
    // Update last login
    user.lastLogin = new Date()
    await user.save()

    console.log("🎫 Generating JWT token...")
    // Generate JWT token with proper payload
    const tokenPayload = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "24h",
      issuer: "two-wheeler-crm",
      audience: "crm-users",
    })

    console.log("✅ Login successful for user:", username)

    // Return success response
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    res.status(500).json({
      error: "Internal server error. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Verify token
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// Get user permissions for role-based UI rendering
app.get("/api/auth/permissions", authenticateToken, (req, res) => {
  const permissions = {
    canCreateServiceRequests: req.user.role === 'staff',
    canViewServiceRequests: req.user.role === 'staff',
    canEditServiceRequests: req.user.role === 'staff',
    canDeleteServiceRequests: req.user.role === 'staff',
    canCreateCustomers: ['admin', 'manager', 'staff'].includes(req.user.role),
    canDeleteCustomers: ['admin', 'manager'].includes(req.user.role),
    canViewAnalytics: ['admin', 'manager', 'staff'].includes(req.user.role),
    canManageUsers: ['admin', 'manager'].includes(req.user.role),
    canManageInventory: ['admin', 'manager', 'staff'].includes(req.user.role),
    canDeleteInventory: ['admin', 'manager'].includes(req.user.role),
    role: req.user.role
  }
  
  res.json({ 
    user: req.user,
    permissions
  })
})

// Logout
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  console.log("👋 User logged out:", req.user.username)
  res.json({ message: "Logged out successfully" })
})

// Debug route - TEMPORARY (remove in production)
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await Admin.find({}, "username email role isActive").limit(10)
    res.json({
      count: users.length,
      users: users,
      connectionState: mongoose.connection.readyState,
      connectionStates: {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Protected Routes - now handled by modular routes


// Service Request Routes are now handled by modular routes

// Dashboard Stats Route (require authentication)
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments()
    const activeRequests = await ServiceRequest.countDocuments({
      status: "Pending",
    })
    const completedRequests = await ServiceRequest.countDocuments({
      status: "Completed",
    })

    // Calculate total revenue from completed requests
    const revenueResult = await ServiceRequest.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ])
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0

    // Get recent activities
    const recentActivities = await ServiceRequest.find()
      .populate("customerId", "name")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("customerName vehicle issue status cost updatedAt")

    const formattedActivities = recentActivities.map((activity) => ({
      id: activity._id,
      customer: activity.customerName || (activity.customerId ? activity.customerId.name : "Unknown"),
      action: `${activity.status} - ${activity.issue.substring(0, 50)}...`,
      time: getTimeAgo(activity.updatedAt),
      vehicle: activity.vehicle,
    }))

    res.json({
      totalCustomers,
      activeRequests,
      completedRequests,
      totalRevenue,
      recentActivities: formattedActivities,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Monthly Revenue Report Route (require authentication and specific roles)
app.get("/api/reports/monthly-revenue", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    // Get monthly revenue data for the last 6 months
    const monthlyRevenue = await ServiceRequest.aggregate([
      {
        $match: {
          status: "Completed",
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$cost" },
          services: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ])

    // Format the data with month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const formattedData = monthlyRevenue.map(item => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue,
      services: item.services
    }))

    res.json(formattedData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date()
  const diffInMs = now - new Date(date)
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  } else {
    return "Less than an hour ago"
  }
}

// User Management Routes - Role-based access control

// Get all users (Admin and Manager)
app.get("/api/admin/users", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    let users;
    if (req.user.role === "admin") {
      // Admin can see all users except themselves
      users = await Admin.find({ _id: { $ne: req.user.id } }).select("-password")
    } else if (req.user.role === "manager") {
      // Manager can only see staff users
      users = await Admin.find({ 
        _id: { $ne: req.user.id },
        role: "staff"
      }).select("-password")
    }
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create Manager (Admin only)
app.post("/api/admin/create-manager", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { username, password, name, email } = req.body
    
    // Validation
    if (!username || !password || !name || !email) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" })
    }

    // Check if user already exists
    const existingUser = await Admin.findOne({
      $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }],
    })

    if (existingUser) {
      if (existingUser.username === username.toLowerCase().trim()) {
        return res.status(400).json({ error: "Username already exists" })
      } else {
        return res.status(400).json({ error: "Email already exists" })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newManager = new Admin({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: "manager",
      email: email.toLowerCase().trim(),
      isActive: true,
    })

    const savedUser = await newManager.save()
    const userResponse = savedUser.toObject()
    delete userResponse.password

    console.log(`✅ Manager created by Admin ${req.user.username}:`, savedUser.username)
    res.status(201).json({
      success: true,
      message: "Manager created successfully",
      user: userResponse,
    })
  } catch (error) {
    console.error("❌ Create manager error:", error)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      })
    }
    res.status(400).json({ error: error.message })
  }
})

// Create Staff (Admin or Manager)
app.post("/api/admin/create-staff", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { username, password, name, email } = req.body
    
    // Validation
    if (!username || !password || !name || !email) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" })
    }

    // Check if user already exists
    const existingUser = await Admin.findOne({
      $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }],
    })

    if (existingUser) {
      if (existingUser.username === username.toLowerCase().trim()) {
        return res.status(400).json({ error: "Username already exists" })
      } else {
        return res.status(400).json({ error: "Email already exists" })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newStaff = new Admin({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: "staff",
      email: email.toLowerCase().trim(),
      isActive: true,
    })

    const savedUser = await newStaff.save()
    const userResponse = savedUser.toObject()
    delete userResponse.password

    console.log(`✅ Staff created by ${req.user.role} ${req.user.username}:`, savedUser.username)
    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      user: userResponse,
    })
  } catch (error) {
    console.error("❌ Create staff error:", error)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      })
    }
    res.status(400).json({ error: error.message })
  }
})

// General user creation (Admin only - restricted to manager creation)
app.post("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { username, password, name, role, email } = req.body
    
    // Validation
    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Restrict admin creation - only allow manager creation
    if (role !== 'manager') {
      return res.status(403).json({ error: "Admins can only create manager accounts. Use specific endpoints for other roles." })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new Admin({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      name,
      role,
      email: email.toLowerCase().trim(),
    })

    const savedUser = await newUser.save()
    const userResponse = savedUser.toObject()
    delete userResponse.password

    res.status(201).json(userResponse)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Update user
app.put("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { username, password, name, role, email, isActive } = req.body
    const updateData = {
      username: username.toLowerCase().trim(),
      name,
      role,
      email: email.toLowerCase().trim(),
      isActive
    }

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await Admin.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password")

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(updatedUser)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Delete user
app.delete("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const deletedUser = await Admin.findByIdAndDelete(req.params.id)
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" })
    }
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Toggle user status
app.patch("/api/admin/users/:id/toggle-status", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { isActive } = req.body
    const updatedUser = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password")

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(updatedUser)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Inventory Management Routes
app.get("/api/inventory", authenticateToken, async (req, res) => {
  try {
    const items = await InventoryItem.find().populate("createdBy", "name username").sort({ createdAt: -1 })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/inventory", authenticateToken, async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      createdBy: req.user.id,
    }
    const item = new InventoryItem(itemData)
    const savedItem = await item.save()
    const populatedItem = await InventoryItem.findById(savedItem._id).populate("createdBy", "name username")
    res.status(201).json(populatedItem)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get("/api/inventory/:id", authenticateToken, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id).populate("createdBy", "name username")
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" })
    }
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/inventory/:id", authenticateToken, async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name username")
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" })
    }
    res.json(item)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete("/api/inventory/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id)
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" })
    }
    res.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Backward compatibility - redirect old endpoints to new ones
app.all('/api/requests*', (req, res, next) => {
  console.log(`🔄 Redirecting ${req.method} ${req.originalUrl} to ${req.originalUrl.replace('/api/requests', '/api/service-requests')}`)
  req.url = req.url.replace('/api/requests', '/api/service-requests')
  next()
})

// Modular Routes
app.use('/api/customers', require('./routes/customers'))
app.use('/api/service-requests', require('./routes/serviceRequests'))
app.use('/api/customer-analytics', require('./routes/customerAnalytics'))
app.use('/api/settings', require('./routes/settings'))

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Fix My Ride API with Authentication is running",
    mongodb: {
      state: mongoose.connection.readyState,
      states: {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      },
    },
  })
})

// Test route to verify server is working
app.get("/test", (req, res) => {
  res.json({ message: "Server is working!", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler - MUST BE LAST
app.use("*", (req, res) => {
  console.log("❌ Route not found:", req.method, req.originalUrl)
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      "POST /api/auth/login",
      "GET /api/auth/verify",
      "POST /api/admin/create-manager",
      "POST /api/admin/create-staff",
      "GET /api/customers",
      "POST /api/customers",
      "GET /api/requests",
      "POST /api/requests",
      "GET /api/dashboard/stats",
    ],
  })
})

// Only listen when not in serverless environment (like Vercel)
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`)
    console.log(`📍 Server URL: http://localhost:${PORT}`)
    console.log("🔐 Default admin credentials:")
    console.log("   Username: admin, Password: admin123")
    console.log("   Username: manager, Password: manager123")
    console.log("   Username: staff, Password: staff123")
    console.log("📝 Available endpoints:")
    console.log("   POST /api/auth/login - User login")
    console.log("   POST /api/admin/create-manager - Create manager (Admin only)")
    console.log("   POST /api/admin/create-staff - Create staff (Admin/Manager)")
    console.log("   GET /api/health - Health check")
    console.log("   GET /test - Test endpoint")
    console.log("   GET /api/debug/users - Debug users (TEMPORARY)")
    console.log("🔌 WebSocket server enabled for real-time updates")
  })
}

module.exports = app
