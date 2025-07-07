"use client"

import { BarChart3, Users, Wrench, FileText, Package, UserCog, Settings } from "lucide-react"
import { useAuth } from "./auth-context"
import Logo from "./Logo"

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
}

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { user } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin", "manager", "staff"] },
    { id: "customers", label: "Customers", icon: Users, roles: ["admin", "manager", "staff"] },
    { id: "service-requests", label: "Service Requests", icon: Wrench, roles: ["staff"] },
    { id: "reports", label: "Reports", icon: FileText, roles: ["admin", "manager"] },
    { id: "inventory", label: "Inventory", icon: Package, roles: ["admin", "manager", "staff"] },
    { id: "user-management", label: "User Management", icon: UserCog, roles: ["admin", "manager"] },
    { id: "settings", label: "Settings", icon: Settings, roles: ["admin"] },
  ]

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => user?.role && item.roles.includes(user.role))

  return (
    <div className="w-64 fixed top-0 left-0 z-40 bg-blue-900 text-white shadow-lg h-screen">
      <div className="p-6">
        <Logo variant="dark" className="mb-2" />
        <div className="mt-2 text-sm text-blue-200 capitalize">{user?.role} Panel</div>
      </div>

      <nav className="mt-6">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-blue-800 transition-colors ${
                activeSection === item.id ? "bg-blue-800 border-r-4 border-blue-400" : ""
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Info at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-blue-800">
        <div className="text-sm">
          <p className="font-medium">{user?.name}</p>
          <p className="text-blue-200 text-xs capitalize">{user?.role}</p>
        </div>
      </div>
    </div>
  )
}
