const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bodyParser = require("body-parser")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// MongoDB Connection
mongoose.connect(
  "mongodb+srv://khandelwalakarshak:mJpMfI2SiodRF2HT@cluster0.a4xel.mongodb.net/two-wheeler-crm?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
)

const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"))
db.once("open", () => {
  console.log("Connected to MongoDB")
})

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
      required: true,
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
  },
  {
    timestamps: true,
  },
)

// Models
const Customer = mongoose.model("Customer", customerSchema)
const ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema)

// Routes

// Customer Routes
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/customers", async (req, res) => {
  try {
    const customer = new Customer(req.body)
    const savedCustomer = await customer.save()
    res.status(201).json(savedCustomer)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get("/api/customers/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    res.json(customer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/customers/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    res.json(customer)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete("/api/customers/:id", async (req, res) => {
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

// Service Request Routes
app.get("/api/requests", async (req, res) => {
  try {
    const requests = await ServiceRequest.find().populate("customerId", "name phone email").sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/requests", async (req, res) => {
  try {
    const serviceRequest = new ServiceRequest(req.body)
    const savedRequest = await serviceRequest.save()
    const populatedRequest = await ServiceRequest.findById(savedRequest._id).populate("customerId", "name phone email")
    res.status(201).json(populatedRequest)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get("/api/requests/:id", async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id).populate("customerId", "name phone email vehicleModel")
    if (!request) {
      return res.status(404).json({ error: "Service request not found" })
    }
    res.json(request)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/requests/:id", async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("customerId", "name phone email")
    if (!request) {
      return res.status(404).json({ error: "Service request not found" })
    }
    res.json(request)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete("/api/requests/:id", async (req, res) => {
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

// Dashboard Stats Route
app.get("/api/dashboard/stats", async (req, res) => {
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

    res.json({
      totalCustomers,
      activeRequests,
      completedRequests,
      totalRevenue,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Two Wheeler CRM API is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = app
