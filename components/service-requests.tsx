"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, X } from "lucide-react"
import { useAuth } from "./auth-context"
import { apiRequest } from "../lib/api"

interface ServiceRequest {
  _id?: string
  customerId?: string
  customerName: string
  customerPhone: string
  vehicle: string
  serviceType: string
  issue: string
  status: "Pending" | "In Progress" | "Completed" | "Cancelled"
  priority: "Low" | "Medium" | "Urgent"
  estimatedCompletionTime: number // in hours
  cost: number
  createdAt?: string
  completedAt?: string
}

export default function ServiceRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null)
  const [formData, setFormData] = useState<ServiceRequest>({
    customerName: "",
    customerPhone: "",
    vehicle: "",
    serviceType: "General Maintenance",
    issue: "",
    status: "Pending",
    priority: "Medium",
    estimatedCompletionTime: 24,
    cost: 0,
  })
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackRequestId, setFeedbackRequestId] = useState<string | null>(null)

  // Helper function to format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    })
  }

  useEffect(() => {
    fetchServiceRequests()
  }, [])


  const fetchServiceRequests = async () => {
    setIsLoadingRequests(true)
    try {
      // Create a promise that resolves after minimum loading time
      // Reasonable timeout for Vercel-Render deployment
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 4000)) // 4 seconds minimum
      
      const apiPromise = apiRequest("/api/service-requests")
      
      // Wait for both the API call and minimum loading time
      const [response] = await Promise.all([apiPromise, minLoadingTime])
      
      if (response.ok) {
        const data = await response.json()
        // Handle both direct array and paginated response
        if (Array.isArray(data)) {
          setRequests(data)
        } else if (data.requests && Array.isArray(data.requests)) {
          setRequests(data.requests)
        } else {
          console.error("Expected requests array, got:", data)
          setRequests([])
        }
      } else {
        console.error("Failed to fetch service requests")
        setRequests([])
      }
    } catch (error) {
      console.error("Error fetching service requests:", error)
      setRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = editingRequest 
        ? `/api/service-requests/${editingRequest._id}`
        : "/api/service-requests"
      
      const method = editingRequest ? "PUT" : "POST"
     
      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const savedRequest = await response.json()
        console.log("Server response:", savedRequest)
        console.log("Saved priority:", savedRequest.priority)
        
        if (editingRequest) {
          setRequests(requests.map(r => r._id === savedRequest._id ? savedRequest : r))
        } else {
          setRequests([savedRequest, ...requests])
        }
        resetForm()
      } else {
        const errorData = await response.json()
        console.error("Failed to save service request:", errorData)
        console.error("Response status:", response.status)
        alert("Failed to save service request: " + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error("Error saving service request:", error)
      alert("Error saving service request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      vehicle: "",
      serviceType: "General Maintenance",
      issue: "",
      status: "Pending",
      priority: "Medium",
      estimatedCompletionTime: 24,
      cost: 0,
    })
    setShowForm(false)
    setEditingRequest(null)
  }

  // Edit service request
  const handleEdit = (request: ServiceRequest) => {
    setEditingRequest(request)
    setFormData(request)
    setShowForm(true)
  }

  // Delete service request
  const handleDelete = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to delete this service request?")) return
    
    // Check role permissions
    if (!["admin", "manager"].includes(user?.role || "")) {
      alert("You don't have permission to delete service requests.")
      return
    }

    try {
      const response = await apiRequest(`/api/service-requests/${requestId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setRequests(requests.filter((request) => request._id !== requestId))
        alert("Service request deleted successfully.")
      } else {
        const errorData = await response.json()
        console.error("Failed to delete service request:", errorData.error)
        alert("Failed to delete service request: " + errorData.error)
      }
    } catch (error) {
      console.error("Error deleting service request:", error)
      alert("Error deleting service request. Please try again.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "cost" || name === "estimatedCompletionTime" ? Number(value) : value,
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.issue.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All" || request.status === statusFilter
    const matchesPriority = priorityFilter === "All" || request.priority === priorityFilter
    
    // Debug logging
    if (priorityFilter !== "All") {
      console.log("Debug - Request:", {
        customerName: request.customerName,
        priority: request.priority,
        priorityFilter,
        matchesPriority
      })
    }
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by customer, vehicle, service type, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Service Requests List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%] min-w-[120px]">
                  Customer
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%] min-w-[100px]">
                  Vehicle
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%] min-w-[110px]">
                  Service Type
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%] min-w-[140px]">
                  Issue
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] min-w-[80px]">
                  Priority
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%] min-w-[90px]">
                  Status
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] min-w-[80px]">Cost</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%] min-w-[70px]">Actions</th>
              </tr>
            </thead>
            			<tbody className="bg-white divide-y divide-gray-200">
              {isLoadingRequests ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-500 text-base">Loading service requests...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-6 text-center text-sm text-gray-500">
                    {searchTerm || statusFilter !== "All" || priorityFilter !== "All"
                      ? "No service requests found matching your filters." 
                      : "No service requests found. Create your first service request to get started."
                    }
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-2 py-4 text-sm font-medium text-gray-900">
                      <div className="truncate" title={request.customerName}>
                        {request.customerName}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500">
                      <div className="truncate" title={request.vehicle}>
                        {request.vehicle}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500">
                      <div className="truncate" title={request.serviceType}>
                        {request.serviceType}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500">
                      <div className="truncate" title={request.issue}>
                        {request.issue}
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <span className={`px-1.5 py-0.5 text-xs rounded-full font-semibold whitespace-nowrap ${
                        request.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        request.priority === 'Low' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span className={`px-1.5 py-0.5 text-xs rounded-full font-semibold whitespace-nowrap ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-sm font-medium text-green-600">
                      <div className="truncate">
                        {formatCurrency(request.cost)}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-500">
                      <div className="flex space-x-1 justify-center">
                        <button 
                          onClick={() => handleEdit(request)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit Request"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {["admin", "manager"].includes(user?.role || "") && (
                          <button 
                            onClick={() => handleDelete(request._id!)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingRequest ? "Edit Service Request" : "New Service Request"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <input
                  type="text"
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Honda Activa 6G"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Oil Change">Oil Change</option>
                  <option value="Brake Service">Brake Service</option>
                  <option value="Engine Repair">Engine Repair</option>
                  <option value="Battery Replacement">Battery Replacement</option>
                  <option value="Tire Service">Tire Service</option>
                  <option value="Chain & Sprocket">Chain & Sprocket</option>
                  <option value="Electrical Repair">Electrical Repair</option>
                  <option value="General Maintenance">General Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description *</label>
                <textarea
                  name="issue"
                  value={formData.issue}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Describe the issue or service required"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (hours)</label>
                  <input
                    type="number"
                    name="estimatedCompletionTime"
                    value={formData.estimatedCompletionTime}
                    onChange={handleInputChange}
                    min="1"
                    max="168"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹) *</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter service cost"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : editingRequest ? "Update Request" : "Create Request"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
