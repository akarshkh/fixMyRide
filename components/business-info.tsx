"use client"

import { useState, useEffect } from "react"
import { Building, Phone, Mail, MapPin, Clock, Globe } from "lucide-react"
import { apiRequest } from "../lib/api"

interface BusinessAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface WorkingHours {
  [key: string]: {
    open: string
    close: string
    isOpen: boolean
  }
}

interface BusinessInfo {
  businessName: string
  businessPhone: string
  businessEmail: string
  businessAddress: BusinessAddress
  businessWebsite?: string
  workingHours: WorkingHours
}

interface BusinessInfoProps {
  compact?: boolean
  showWorkingHours?: boolean
  className?: string
}

export default function BusinessInfo({ 
  compact = false, 
  showWorkingHours = false, 
  className = "" 
}: BusinessInfoProps) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBusinessInfo()
  }, [])

  const fetchBusinessInfo = async () => {
    try {
      const response = await apiRequest('/api/settings/business')
      
      if (response.ok) {
        const data = await response.json()
        setBusinessInfo(data.data)
      }
    } catch (error) {
      console.error('Error fetching business info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: BusinessAddress) => {
    const parts = [address.street, address.city, address.state, address.zipCode, address.country]
    return parts.filter(part => part && part.trim()).join(', ')
  }

  const getCurrentDayStatus = () => {
    if (!businessInfo?.workingHours) return null
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayHours = businessInfo.workingHours[today]
    
    if (!todayHours || !todayHours.isOpen) {
      return { isOpen: false, text: 'Closed Today' }
    }
    
    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const openTime = parseInt(todayHours.open.replace(':', ''))
    const closeTime = parseInt(todayHours.close.replace(':', ''))
    
    const isCurrentlyOpen = currentTime >= openTime && currentTime <= closeTime
    
    return {
      isOpen: isCurrentlyOpen,
      text: isCurrentlyOpen ? 
        `Open until ${todayHours.close}` : 
        `Opens at ${todayHours.open}`
    }
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!businessInfo) {
    return null
  }

  const dayStatus = getCurrentDayStatus()

  if (compact) {
    return (
      <div className={`${className}`}>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{businessInfo.businessName}</h2>
        <div className="space-y-1 text-sm text-gray-600">
          {businessInfo.businessPhone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              {businessInfo.businessPhone}
            </div>
          )}
          {businessInfo.businessEmail && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {businessInfo.businessEmail}
            </div>
          )}
          {dayStatus && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span className={dayStatus.isOpen ? 'text-green-600' : 'text-red-600'}>
                {dayStatus.text}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <Building className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">{businessInfo.businessName}</h2>
      </div>
      
      <div className="space-y-3">
        {businessInfo.businessPhone && (
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-400 mr-3" />
            <span className="text-gray-700">{businessInfo.businessPhone}</span>
          </div>
        )}
        
        {businessInfo.businessEmail && (
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-400 mr-3" />
            <span className="text-gray-700">{businessInfo.businessEmail}</span>
          </div>
        )}
        
        {businessInfo.businessWebsite && (
          <div className="flex items-center">
            <Globe className="h-4 w-4 text-gray-400 mr-3" />
            <a 
              href={businessInfo.businessWebsite} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              {businessInfo.businessWebsite}
            </a>
          </div>
        )}
        
        {businessInfo.businessAddress && formatAddress(businessInfo.businessAddress) && (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
            <span className="text-gray-700">{formatAddress(businessInfo.businessAddress)}</span>
          </div>
        )}
        
        {dayStatus && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-3" />
            <span className={dayStatus.isOpen ? 'text-green-600' : 'text-red-600'}>
              {dayStatus.text}
            </span>
          </div>
        )}
      </div>
      
      {showWorkingHours && businessInfo.workingHours && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Working Hours</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(businessInfo.workingHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize text-gray-600">{day}</span>
                <span className="text-gray-700">
                  {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
