"use client"

import React, { useState, useEffect } from "react"
import { TimelineItem } from "lucide-react";
import { useAuth } from "./auth-context"

interface ServiceHistoryProps {
  customerId: string;
}

interface ServiceEntry {
  date: string;
  details: string;
  cost: number;
  status: string;
}

export default function ServiceHistory({ customerId }: ServiceHistoryProps) {
  const { user } = useAuth()
  const [serviceHistory, setServiceHistory] = useState<Array<ServiceEntry>>([])

  useEffect(() => {
    fetchServiceHistory()
  }, [customerId])

  const fetchServiceHistory = async () => {
    try {
      const response = await apiRequest(`/api/customers/${customerId}/history`)

      if (response.ok) {
        const data = await response.json()
        setServiceHistory(data)
      } else {
        console.error("Failed to fetch service history")
      }
    } catch (error) {
      console.error("Error fetching service history:", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Service History</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {serviceHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No service history available for this customer.</p>
          </div>
        ) : (
          <ol className="relative border-l border-gray-200">
            {serviceHistory.map((entry, index) => (
              <li className="mb-10 ml-6" key={index}>
                <div className="absolute w-3 h-3 bg-blue-400 rounded-full mt-1.5 -left-1.5 border border-white"></div>
                <time className="mb-1 text-sm font-normal leading-none text-gray-400">{new Date(entry.date).toLocaleDateString("en-IN")}</time>
                <h3 className="text-lg font-semibold text-gray-900">{entry.details}</h3>
                <p className="text-sm text-gray-500">Cost: ₹{entry.cost.toLocaleString("en-IN")}</p>
                <p className={`text-sm font-medium ${entry.status === "Completed" ? "text-green-600" : "text-yellow-500"}`}>{entry.status}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
