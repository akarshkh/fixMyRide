"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { API_BASE_URL } from "../lib/api"

interface User {
  id: string
  username: string
  role: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (credentials: { username: string; password: string }) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("crm_user")
    const savedToken = localStorage.getItem("crm_token")

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem("crm_user")
        localStorage.removeItem("crm_token")
      }
    }
  }, [])

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔐 Starting login process...")

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password,
        }),
      })

      console.log("📡 Login response status:", response.status)

      let data
      try {
        data = await response.json()
        console.log("📡 Login response received")
      } catch (parseError) {
        console.error("❌ Failed to parse login response:", parseError)
        setError("Invalid response from server. Please try again.")
        setIsLoading(false)
        return false
      }

      if (response.ok && data.success && data.token) {
        console.log("✅ Login successful")

        const userData: User = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          name: data.user.name,
        }

        // Store user data and token
        setUser(userData)
        localStorage.setItem("crm_user", JSON.stringify(userData))
        localStorage.setItem("crm_token", data.token)

        console.log("✅ User data stored successfully")
        setIsLoading(false)
        return true
      } else {
        console.log("❌ Login failed:", data.error)
        setError(data.error || "Login failed")
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Cannot connect to server. Please check your connection and try again.")
      } else {
        setError("Login failed. Please check your connection and try again.")
      }
      setIsLoading(false)
      return false
    }
  }

  // Note: Signup functionality removed as backend endpoint doesn't exist
  // User creation should be handled through admin panel in production

  const logout = () => {
    setUser(null)
    localStorage.removeItem("crm_user")
    localStorage.removeItem("crm_token")
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>{children}</AuthContext.Provider>
  )
}
