"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, X, Eye, EyeOff, UserPlus, Shield } from "lucide-react"
import { useAuth } from "./auth-context"

interface User {
  _id?: string
  username: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  isActive: boolean
  lastLogin?: string
  createdAt?: string
}

export default function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<Partial<User & { password: string }>>(() => {
    // Set default role based on user permissions
    const defaultRole = user?.role === "admin" ? "manager" : "staff";
    return {
      username: "",
      name: "",
      email: "",
      role: defaultRole,
      password: "",
      isActive: true,
    };
  })

  // Check if user has access to user management
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only Admin and Manager users can access user management.</p>
        </div>
      </div>
    )
  }

  // Determine what roles the current user can create
  const canCreateRole = (role: string) => {
    if (user.role === "admin") {
      return role === "manager" // Admin can only create managers
    }
    if (user.role === "manager") {
      return role === "staff" // Manager can only create staff
    }
    return false
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("crm_token")
      let url: string
      
      if (editingUser) {
        // Use existing edit endpoint
        url = `http://localhost:5000/api/admin/users/${editingUser._id}`
      } else {
        // Use role-based creation endpoints
        if (formData.role === "manager") {
          url = "http://localhost:5000/api/admin/create-manager"
        } else if (formData.role === "staff") {
          url = "http://localhost:5000/api/admin/create-staff"
        } else {
          // Fallback to general user creation for admin role
          url = "http://localhost:5000/api/admin/users"
        }
      }
      
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const savedUser = await response.json()
        if (editingUser) {
          setUsers(users.map(u => u._id === savedUser._id ? savedUser : u))
        } else {
          setUsers([savedUser, ...users])
        }
        resetForm()
        alert(editingUser ? "User updated successfully!" : "User created successfully!")
      } else {
        const errorData = await response.json()
        console.error("Failed to save user:", errorData.error)
        alert("Failed to save user: " + errorData.error)
      }
    } catch (error) {
      console.error("Error saving user:", error)
      alert("Error saving user. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    // Set default role based on user permissions
    const defaultRole = user?.role === "admin" ? "manager" : "staff";
    setFormData({
      username: "",
      name: "",
      email: "",
      role: defaultRole,
      password: "",
      isActive: true,
    })
    setShowForm(false)
    setEditingUser(null)
    setShowPassword(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      ...user,
      password: "", // Don't populate password for security
    })
    setShowForm(true)
  }

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return

    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setUsers(users.filter((user) => user._id !== userId))
        alert("User deleted successfully.")
      } else {
        const errorData = await response.json()
        console.error("Failed to delete user:", errorData.error)
        alert("Failed to delete user: " + errorData.error)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error deleting user. Please try again.")
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("crm_token")
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u))
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully.`)
      } else {
        alert("Failed to update user status.")
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
      alert("Error updating user status.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "staff":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>
            {user?.role === "admin" ? "Add Manager" : "Add Staff"}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || roleFilter !== "all" 
                      ? "No users found matching your filters." 
                      : "No users found."
                    }
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(user._id!, user.isActive)}
                          className={user.isActive ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                        >
                          {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingUser ? "Edit User" : "Add New User"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  name="role"
                  value={formData.role || (canCreateRole("manager") ? "manager" : "staff")}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {canCreateRole("staff") && <option value="staff">Staff</option>}
                  {canCreateRole("manager") && <option value="manager">Manager</option>}
                  {canCreateRole("admin") && <option value="admin">Admin</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? "(leave blank to keep current)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password || ""}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active User</label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : editingUser ? "Update User" : "Create User"}
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
