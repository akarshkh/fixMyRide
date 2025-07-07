"use client"

import React, { useState, useEffect } from "react"
import { Bell, X, AlertCircle, CheckCircle, Info, Clock } from "lucide-react"
import { useAuth } from "./auth-context"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load notifications from API
    const loadNotifications = async () => {
      try {
        // TODO: Implement API endpoint for notifications
        // const token = localStorage.getItem("crm_token")
        // const response = await fetch("http://localhost:5000/api/notifications", {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     "Content-Type": "application/json",
        //   },
        // })
        // 
        // if (response.ok) {
        //   const data = await response.json()
        //   setNotifications(data)
        //   setUnreadCount(data.filter(n => !n.read).length)
        // } else {
        //   console.error("Failed to fetch notifications")
        //   setNotifications([])
        //   setUnreadCount(0)
        // }
        
        // For now, no notifications until API is implemented
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    }
    
    loadNotifications();
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
