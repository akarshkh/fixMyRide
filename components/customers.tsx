"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X } from "lucide-react"
import { useAuth } from "./auth-context"

interface Customer {
  _id?: string
  name: string
  phone: string
  email: string
  vehicleModel: string
  lastServiceDate: string
  totalSpend: number
}

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or vehicle model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 
                      "No customers found matching your search." : 
                      "No customers found. Add your first customer to get started."
                    }
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer: Customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.vehicleModel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.lastServiceDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(customer.totalSpend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {["admin", "manager"].includes(user?.role || "") && (
                          <button 
                            onClick={() => handleDelete(customer._id!)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  )
}
