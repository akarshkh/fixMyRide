"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, Wrench, Calendar, Download } from "lucide-react"
import { useAuth } from "./auth-context"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

export default function Reports() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    })
  }

  // Check role permissions for reports
  if (!user || !["admin", "manager"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only Admin and Manager roles can access reports.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchMonthlyRevenue()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
      } else {
        console.error("Failed to fetch dashboard stats")
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMonthlyRevenue = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/monthly-revenue`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setMonthlyData(data)
      } else {
        console.error("Failed to fetch monthly revenue data")
        // Don't show sample data - leave empty if API fails
        setMonthlyData([])
      }
    } catch (error) {
      console.error("Error fetching monthly revenue:", error)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/export`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          period: selectedPeriod,
          dashboardStats,
          monthlyData
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `crm-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error("Failed to export report")
        alert("Failed to export report. Please try again.")
      }
    } catch (error) {
      console.error("Error exporting report:", error)
      alert("Error exporting report. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button 
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardStats.totalRevenue)}
              </p>
              <p className="text-sm text-green-600">{dashboardStats.percentageChanges?.revenue || '0'}% from last period</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalCustomers}
              </p>
              <p className="text-sm text-blue-600">{dashboardStats.percentageChanges?.customers || '0'}% from last period</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.completedRequests}
              </p>
              <p className="text-sm text-purple-600">{dashboardStats.percentageChanges?.completedRequests || '0'}% from last period</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">Loading revenue data...</div>
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">No revenue data available. Complete some service requests to see trends.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chart Header */}
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Month</span>
                <span>Revenue</span>
              </div>
              
              {/* Bar Chart */}
              <div className="space-y-3">
                {monthlyData.map((data, index) => {
                  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue))
                  const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 w-12">{data.month}</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-3 relative">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(data.revenue)}
                        </span>
                        {data.services && (
                          <div className="text-xs text-gray-500">
                            {data.services} services
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Summary */}
              {monthlyData.length > 0 && (
                <div className="pt-4 border-t border-gray-200 mt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Highest: </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(Math.max(...monthlyData.map(d => d.revenue)))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Average: </span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(monthlyData.reduce((sum, d) => sum + d.revenue, 0) / monthlyData.length)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Service Status Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Status Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Active Requests</p>
                <p className="text-sm text-gray-600">Pending & In Progress</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{dashboardStats.activeRequests}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Completed Services</p>
                <p className="text-sm text-gray-600">Total completed</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{dashboardStats.completedRequests}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Revenue</p>
                <p className="text-sm text-gray-600">From completed services</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">{formatCurrency(dashboardStats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Active Customers</h3>
            <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalCustomers}</p>
            <p className="text-sm text-gray-600">Regular service customers</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Avg. Spend</h3>
            <p className="text-2xl font-bold text-green-600">
              {dashboardStats.totalCustomers > 0 
                ? formatCurrency(dashboardStats.totalRevenue / dashboardStats.totalCustomers)
                : formatCurrency(0)
              }
            </p>
            <p className="text-sm text-gray-600">Per customer annually</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Retention Rate</h3>
            <p className="text-2xl font-bold text-purple-600">87%</p>
            <p className="text-sm text-gray-600">Customer retention</p>
          </div>
        </div>
      </div>
    </div>
  )
}
