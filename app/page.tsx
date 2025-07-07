"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/components/auth-context"
import Login from "@/components/login"
import Dashboard from "@/components/dashboard"
import Customers from "@/components/customers"
import ServiceRequests from "@/components/service-requests"
import Reports from "@/components/reports"
import UserManagement from "@/components/user-management"
import InventoryManagement from "@/components/inventory-management"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

function AppContent() {
  const { user, login, isLoading, error } = useAuth()
  const [activeSection, setActiveSection] = useState("dashboard")


  // Show login page if user is not authenticated
  if (!user) {
    return <Login onLogin={login} isLoading={isLoading} error={error} />
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />
      case "customers":
        return <Customers />
      case "service-requests":
        return <ServiceRequests />
      case "reports":
        return <Reports />
      case "user-management":
        return <UserManagement />
      case "inventory":
        return <InventoryManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 mt-20">
          <div className="max-w-7xl mx-auto">{renderActiveSection()}</div>
        </main>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
