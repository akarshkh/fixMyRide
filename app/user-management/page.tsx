"use client"

import { AuthProvider, useAuth } from "@/components/auth-context"
import Login from "@/components/login"
import UserManagement from "@/components/user-management"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

function UserManagementPageContent() {
  const { user, login, isLoading, error } = useAuth()

  // Show login page if user is not authenticated
  if (!user) {
    return <Login onLogin={login} isLoading={isLoading} error={error} />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeSection="user-management" setActiveSection={() => {}} />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 mt-20">
          <div className="max-w-7xl mx-auto">
            <UserManagement />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function UserManagementPage() {
  return (
    <AuthProvider>
      <UserManagementPageContent />
    </AuthProvider>
  )
}
