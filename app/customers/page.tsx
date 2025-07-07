"use client"

import { AuthProvider, useAuth } from "@/components/auth-context"
import Login from "@/components/login"
import Customers from "@/components/customers"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

function CustomersPageContent() {
  const { user, login, isLoading, error } = useAuth()

  // Show login page if user is not authenticated
  if (!user) {
    return <Login onLogin={login} isLoading={isLoading} error={error} />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeSection="customers" setActiveSection={() => {}} />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-8 mt-20">
          <div className="w-full">
            <Customers />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  return (
    <AuthProvider>
      <CustomersPageContent />
    </AuthProvider>
  )
}
