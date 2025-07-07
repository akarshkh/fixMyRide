const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// MongoDB Connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI


console.log("🔄 Attempting to connect to MongoDB...")

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // 45 second socket timeout
  bufferMaxEntries: 0,
  maxPoolSize: 10,
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
      required: true,
      trim: true,
      lowercase: true,
    },
    vehicleModel: {
      type: String,
      required: true,
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
    vehicle: {
      type: String,
      required: true,
      trim: true,
    },
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
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
  },
  {
    timestamps: true,
  },
)

// Models
const Admin = mongoose.model("Admin", adminSchema)
const Customer = mongoose.model("Customer", customerSchema)
const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema)

// JWT Middleware - ENHANCED
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

// Initialize default admin user
const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: "admin" })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10)
      const defaultAdmin = new Admin({
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        role: "admin",
        email: "admin@twowheeelercrm.com",
      })
      await defaultAdmin.save()
      console.log("✅ Default admin user created")
    }

    // Create manager user
    const managerExists = await Admin.findOne({ username: "manager" })
    if (!managerExists) {
      const hashedPassword = await bcrypt.hash("manager123", 10)
      const managerUser = new Admin({
        username: "manager",
        password: hashedPassword,
        name: "Service Manager",
        role: "manager",
        email: "manager@twowheeelercrm.com",
      })
      await managerUser.save()
      console.log("✅ Default manager user created")
    }

    // Create staff user
    const staffExists = await Admin.findOne({ username: "staff" })
    if (!staffExists) {
      const hashedPassword = await bcrypt.hash("staff123", 10)
      const staffUser = new Admin({
        username: "staff",
        password: hashedPassword,
        name: "Service Staff",
        role: "staff",
        email: "staff@twowheeelercrm.com",
      })
      await staffUser.save()
      console.log("✅ Default staff user created")
    }
  } catch (error) {
    console.error("❌ Error initializing admin users:", error)
  }
}

// Initialize admin users on startup
initializeAdmin()

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Two Wheeler CRM API Server",
    status: "running",
    endpoints: [
      "POST /api/auth/signup - User registration",
      "POST /api/auth/login - User login",
      "GET /api/auth/verify - Verify token",
      "GET /api/customers - Get customers",
      "POST /api/customers - Create customer",
      "GET /api/requests - Get service requests",
      "POST /api/requests - Create service request",
      "GET /api/dashboard/stats - Dashboard statistics",
    ],
  })
})

// Authentication Routes

// Signup Route - ENHANCED
app.post("/api/auth/signup", async (req, res) => {
  console.log("📝 Signup request received")
  console.log("📝 Request body:", { ...req.body, password: "[HIDDEN]" })

  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      console.log("❌ MongoDB not connected, readyState:", mongoose.connection.readyState)
      return res.status(503).json({
        error: "Database connection unavailable. Please try again later.",
      })
    }

    const { username, password, name, email, role } = req.body

    // Enhanced validation
    if (!username || !password || !name || !email) {
      console.log("❌ Missing required fields")
      return res.status(400).json({ error: "All fields are required" })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long" })
    }

    if (password.length < 6) {
      console.log("❌ Password too short")
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" })
    }

    console.log("✅ Validation passed, checking for existing user...")

    // Check if user already exists
    const existingUser = await Admin.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    })

    if (existingUser) {
      console.log("❌ User already exists:", existingUser.username)
      if (existingUser.username === username.toLowerCase()) {
        return res.status(400).json({ error: "Username already exists" })
      } else {
        return res.status(400).json({ error: "Email already exists" })
      }
    }

    console.log("✅ User doesn't exist, creating new user...")

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log("✅ Password hashed successfully")

    // Create new user
    const newUser = new Admin({
      username: username.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      email: email.toLowerCase(),
      role: role || "staff",
      isActive: true,
    })

    console.log("💾 Saving user to database...")
    const savedUser = await newUser.save()
    console.log("✅ User created successfully:", savedUser.username)

    // Return success response (don't include password)
    const userResponse = {
      id: savedUser._id,
      username: savedUser.username,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse,
    })
  } catch (error) {
    console.error("❌ Signup error:", error)

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      })
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ error: messages.join(", ") })
    }

    res.status(500).json({
      error: "Internal server error. Please try again later.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Login Route - ENHANCED
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
      username: username.toLowerCase(),
      isActive: true,
    })

    if (!user) {
      console.log("❌ User not found:", username)
      return res.status(401).json({ error: "Invalid username or password" })
    }

    console.log("✅ User found, verifying password...")
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

// Logout (optional - mainly for logging purposes)
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  console.log("👋 User logged out:", req.user.username)
  res.json({ message: "Logged out successfully" })
})

// Protected Routes

// Customer Routes (require authentication)
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.find().populate("createdBy", "name username").sort({ createdAt: -1 })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/customers", authenticateToken, async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.user.id,
    }
    const customer = new Customer(customerData)
    const savedCustomer = await customer.save()
    const populatedCustomer = await Customer.findById(savedCustomer._id).populate("createdBy", "name username")
    res.status(201).json(populatedCustomer)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get("/api/customers/:id", authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("createdBy", "name username")
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    res.json(customer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/customers/:id", authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name username")
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    res.json(customer)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete("/api/customers/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id)
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    res.json({ message: "Customer deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Service Request Routes (require authentication)
app.get("/api/requests", authenticateToken, async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .populate("customerId", "name phone email vehicleModel")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username")
      .sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/requests", authenticateToken, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      createdBy: req.user.id,
    }
    const serviceRequest = new ServiceRequest(requestData)
    const savedRequest = await serviceRequest.save()
    const populatedRequest = await ServiceRequest.findById(savedRequest._id)
      .populate("customerId", "name phone email vehicleModel")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username")
    res.status(201).json(populatedRequest)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get("/api/requests/:id", authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate("customerId", "name phone email vehicleModel")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username")
    if (!request) {
      return res.status(404).json({ error: "Service request not found" })
    }
    res.json(request)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/requests/:id", authenticateToken, async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("customerId", "name phone email vehicleModel")
      .populate("createdBy", "name username")
      .populate("assignedTo", "name username")
    if (!request) {
      return res.status(404).json({ error: "Service request not found" })
    }
    res.json(request)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete("/api/requests/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id)
    if (!request) {
      return res.status(404).json({ error: "Service request not found" })
    }
    res.json({ message: "Service request deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dashboard Stats Route (require authentication)
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments()
    const activeRequests = await ServiceRequest.countDocuments({
      status: { $in: ["Pending", "In Progress"] },
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

// Admin Management Routes (admin only)
app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const users = await Admin.find({ _id: { $ne: req.user.id } }).select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { username, password, name, role, email } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new Admin({
      username,
      password: hashedPassword,
      name,
      role,
      email,
    })

    const savedUser = await newUser.save()
    const userResponse = savedUser.toObject()
    delete userResponse.password

    res.status(201).json(userResponse)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Two Wheeler CRM API with Authentication is running" })
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
      "POST /api/auth/signup",
      "POST /api/auth/login",
      "GET /api/auth/verify",
      "GET /api/customers",
      "POST /api/customers",
      "GET /api/requests",
      "POST /api/requests",
      "GET /api/dashboard/stats",
    ],
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📍 Server URL: http://localhost:${PORT}`)
  console.log("🔐 Default admin credentials:")
  console.log("   Username: admin, Password: admin123")
  console.log("   Username: manager, Password: manager123")
  console.log("   Username: staff, Password: staff123")
  console.log("📝 Available endpoints:")
  console.log("   POST /api/auth/signup - User registration")
  console.log("   POST /api/auth/login - User login")
  console.log("   GET /api/health - Health check")
  console.log("   GET /test - Test endpoint")
})

module.exports = app
