"use client"

import { Bike } from "lucide-react"

interface LogoProps {
  variant?: "dark" | "light"
  size?: "sm" | "md" | "lg"
  showSubtext?: boolean
  className?: string
}

export default function Logo({ 
  variant = "dark", 
  size = "md", 
  showSubtext = false,
  className = ""
}: LogoProps) {
  const sizeClasses = {
    sm: "h-5 w-5 text-lg",
    md: "h-8 w-8 text-xl",
    lg: "h-10 w-10 text-2xl"
  }

  const textColorClasses = {
    dark: "text-gray-900",
    light: "text-white"
  }

  const subtextColorClasses = {
    dark: "text-gray-600",
    light: "text-blue-200"
  }

  const iconColorClasses = {
    dark: "text-blue-600",
    light: "text-blue-300"
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`p-2 rounded-full ${variant === "dark" ? "bg-blue-100" : "bg-blue-800"}`}>
        <Bike className={`${sizeClasses[size].split(" ").slice(0, 2).join(" ")} ${iconColorClasses[variant]}`} />
      </div>
      <div className="flex flex-col">
        <h1 className={`${sizeClasses[size].split(" ").slice(2).join(" ")} font-bold ${textColorClasses[variant]} leading-tight`}>
          Fix My Ride
        </h1>
        {showSubtext && (
          <p className={`text-xs ${subtextColorClasses[variant]} mt-0.5`}>
            Two-Wheeler CRM
          </p>
        )}
      </div>
    </div>
  )
}
