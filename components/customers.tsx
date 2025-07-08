"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X, TrendingUp, History, Star, DollarSign } from "lucide-react"
import { useAuth } from "./auth-context"
import { apiRequest } from "../lib/api"

interface Customer {
  _id?: string
  name: string
  phone: string
  email: string
  vehicleModel: string
  lastServiceDate: string
  totalSpend: number
  visitCount: number
  category: {
    name: string
    badge: string
    icon: string
    color: string
  }
}

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerHistory, setCustomerHistory] = useState<any>(null)
  const [lifetimeValueData, setLifetimeValueData] = useState<any>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    email: "",
    vehicleModel: "",
    lastServiceDate: "",
    totalSpend: 0,
  })

  // Helper function to format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    })
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch("http://localhost:5000/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
if (Array.isArray(data)) {
  setCustomers(data)
} else if (Array.isArray(data.customers)) {
  setCustomers(data.customers)
} else {
  console.error("Expected customers array, got:", data)
  setCustomers([])
}

      } else {
        console.error("Failed to fetch customers")
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("crm_token")
      const url = editingCustomer 
        ? `http://localhost:5000/api/customers/${editingCustomer._id}`
        : "http://localhost:5000/api/customers"
      
      const method = editingCustomer ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          lastServiceDate: formData.lastServiceDate || new Date().toISOString().split("T")[0],
        }),
      })

      if (response.ok) {
        const savedCustomer = await response.json()
        if (editingCustomer) {
          setCustomers(customers.map(c => c._id === savedCustomer._id ? savedCustomer : c))
        } else {
          setCustomers([savedCustomer, ...customers])
        }
        resetForm()
      } else {
        const errorData = await response.json()
        console.error("Failed to save customer:", errorData.error)
        alert("Failed to save customer: " + errorData.error)
      }
    } catch (error) {
      console.error("Error saving customer:", error)
      alert("Error saving customer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      vehicleModel: "",
      lastServiceDate: "",
      totalSpend: 0,
    })
    setShowForm(false)
    setEditingCustomer(null)
  }

  const handleViewAnalytics = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowAnalyticsModal(true)
    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch(`http://localhost:5000/api/customer-analytics/lifetime-value`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const customerData = data.customers.find((c: any) => c._id === customer._id)
        setLifetimeValueData(customerData)
      } else {
        console.error("Failed to fetch lifetime value data")
      }
    } catch (error) {
      console.error("Error fetching lifetime value data:", error)
    }
  }

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer)
    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch(`http://localhost:5000/api/customer-analytics/${customer._id}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCustomerHistory(data)
        setShowAnalyticsModal(true)
      } else {
        console.error("Failed to fetch service history")
      }
    } catch (error) {
      console.error("Error fetching service history:", error)
    }
  }  

  // Edit customer
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      ...customer,
      lastServiceDate: customer.lastServiceDate.split('T')[0] // Format for date input
    })
    setShowForm(true)
  }

  // Delete customer
  const handleDelete = async (customerId: string) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return
    
    // Check role permissions
    if (!["admin", "manager"].includes(user?.role || "")) {
      alert("You don't have permission to delete customers.")
      return
    }

    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setCustomers(customers.filter((customer) => customer._id !== customerId))
        alert("Customer deleted successfully.")
      } else {
        const errorData = await response.json()
        console.error("Failed to delete customer:", errorData.error)
        alert("Failed to delete customer: " + errorData.error)
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
      alert("Error deleting customer. Please try again.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "totalSpend" ? Number(value) : value,
    }))
  }

  const filteredCustomers = customers.filter((customer: Customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = () => {
      const visitCount = customer.visitCount || 1
      switch (categoryFilter) {
        case 'frequent':
          return visitCount >= 3
        case 'moderate':
          return visitCount === 2
        case 'one-time':
          return visitCount === 1
        default:
          return true
      }
    }
    
    return matchesSearch && matchesCategory()
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <div className="text-sm text-gray-600 italic">
          Customers are automatically created when service requests are made
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or vehicle model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="frequent">Frequent Visitors (3+ visits)</option>
            <option value="moderate">Moderate Visitors (2 visits)</option>
            <option value="one-time">One-Time Visitors (1 visit)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Vehicle Model</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-8 py-8 text-center text-base text-gray-500">
                    {searchTerm ? 
                      "No customers found matching your search." : 
                      "No customers found. Add your first customer to get started."
                    }
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-8 py-5 whitespace-nowrap text-base font-medium text-gray-900">{customer.name}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-500">{customer.phone}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-500">{customer.email}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-500">{customer.vehicleModel}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-base font-medium text-blue-600">
                      {customer.visitCount || 1}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      {customer.category ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          customer.category.color === 'success' ? 'bg-green-100 text-green-800' :
                          customer.category.color === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          <span className="mr-2">{customer.category.icon}</span>
                          {customer.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-500">
                      {new Date(customer.lastServiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-base font-medium text-green-600">
                      {formatCurrency(customer.totalSpend)}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-base text-gray-500">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleViewAnalytics(customer)}
                          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-md transition-colors"
                          title="View Analytics"
                        >
                          <TrendingUp className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleViewHistory(customer)}
                          className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-md transition-colors"
                          title="Service History"
                        >
                          <History className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit Customer"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {["admin", "manager"].includes(user?.role || "") && (
                          <button 
                            onClick={() => handleDelete(customer._id!)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-5 w-5" />
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Service Date</label>
                <input
                  type="date"
                  name="lastServiceDate"
                  value={formData.lastServiceDate || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Spend (₹)</label>
                <input
                  type="number"
                  name="totalSpend"
                  value={formData.totalSpend || 0}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Analytics and History Modal */}
      {showAnalyticsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCustomer.name} - Analytics & History
              </h2>
              <button
                onClick={() => {
                  setShowAnalyticsModal(false)
                  setSelectedCustomer(null)
                  setCustomerHistory(null)
                  setLifetimeValueData(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Customer Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Spend</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatCurrency(selectedCustomer.totalSpend)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Visits</p>
                    <p className="text-2xl font-bold text-green-800">
                      {selectedCustomer.visitCount || 1}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Category</p>
                    <p className="text-lg font-bold text-purple-800">
                      {selectedCustomer.category?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifetime Value Analytics */}
            {lifetimeValueData && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Lifetime Value Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Average Service Value</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(lifetimeValueData.averageServiceValue || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Services</p>
                    <p className="text-xl font-bold text-gray-800">
                      {lifetimeValueData.totalServices || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Customer Lifespan</p>
                    <p className="text-xl font-bold text-gray-800">
                      {Math.round(lifetimeValueData.customerLifespan || 0)} days
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Lifetime Value</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(lifetimeValueData.lifetimeValue || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Service History */}
            {customerHistory && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Service History</h3>
                {customerHistory.serviceHistory && customerHistory.serviceHistory.length > 0 ? (
                  <div className="space-y-4">
                    {customerHistory.serviceHistory.map((service: any, index: number) => (
                      <div key={service._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{service.serviceType}</h4>
                            <p className="text-sm text-gray-600 mt-1">{service.issue}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                              service.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              service.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              service.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {service.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Vehicle: {service.vehicle}</span>
                          <span>Cost: {formatCurrency(service.cost)}</span>
                          <span>{new Date(service.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No service history found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
