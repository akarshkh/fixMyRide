"use client"

import { Users, Clock, Calendar, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL, getAuthHeaders } from "../lib/api"

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])

  // Helper function to format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    })
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          totalCustomers: data.totalCustomers,
          activeRequests: data.activeRequests,
          completedRequests: data.completedRequests,
          totalRevenue: data.totalRevenue,
        })
        setRecentActivities(data.recentActivities || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const metrics = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Active Requests",
      value: stats.activeRequests.toString(),
      icon: Clock,
      color: "bg-orange-500",
      change: "+5%",
    },
    {
      title: "Completed Requests",
      value: stats.completedRequests.toString(),
      icon: Calendar,
      color: "bg-green-500",
      change: "+2%",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "bg-purple-500",
      change: "+18%",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className="text-sm text-green-600">{metric.change} from last month</p>
                </div>
                <div className={`${metric.color} p-3 rounded-full`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No recent activities found.</p>
                <p className="text-sm">Activities will appear here as you add customers and service requests.</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.customer}</p>
                    <p className="text-sm text-gray-600">
                      {activity.action} - {activity.vehicle}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
