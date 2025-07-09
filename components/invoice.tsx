"use client"

import React, { useState, useEffect } from "react";
import { Receipt, Download, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { apiRequest } from "../lib/api";

interface ServiceRequest {
  _id?: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  serviceType: string;
  issue: string;
  cost: number;
  createdAt: string;
  completedAt?: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "Urgent";
}

interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface BusinessInfo {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: BusinessAddress;
  businessWebsite?: string;
}

interface InvoiceProps {
  serviceRequest: ServiceRequest;
  invoiceNumber?: string;
  onPrint?: () => void;
  onDownload?: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ 
  serviceRequest, 
  invoiceNumber = `INV-${Date.now()}`, 
  onPrint,
  onDownload 
}) => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const response = await apiRequest('/api/settings/business');
      
      if (response.ok) {
        const data = await response.json();
        setBusinessInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: BusinessAddress) => {
    const parts = [address.street, address.city, address.state, address.zipCode, address.country];
    return parts.filter(part => part && part.trim()).join(', ');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Low":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="h-8 w-8" />
            <h1 className="text-2xl font-bold">SERVICE INVOICE</h1>
          </div>
          <div className="text-right">
            <p className="text-blue-100">Invoice #</p>
            <p className="text-lg font-semibold">{invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Business Information */}
        {businessInfo && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{businessInfo.businessName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                {businessInfo.businessPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>{businessInfo.businessPhone}</span>
                  </div>
                )}
                {businessInfo.businessEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>{businessInfo.businessEmail}</span>
                  </div>
                )}
              </div>
              <div>
                {businessInfo.businessAddress && formatAddress(businessInfo.businessAddress) && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{formatAddress(businessInfo.businessAddress)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{serviceRequest.customerName}</p>
                <p className="text-gray-600">{serviceRequest.customerPhone}</p>
                <p className="text-gray-600">Vehicle: {serviceRequest.vehicle}</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Service Date: {new Date(serviceRequest.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                {serviceRequest.completedAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Completed: {new Date(serviceRequest.completedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(serviceRequest.status)}`}>
                    {serviceRequest.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(serviceRequest.priority)}`}>
                    {serviceRequest.priority} Priority
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Service Type:</p>
                <p className="font-medium text-gray-900">{serviceRequest.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Issue Description:</p>
                <p className="font-medium text-gray-900">{serviceRequest.issue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(serviceRequest.cost)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Amount in Indian Rupees (INR)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Thank you for choosing our service! We appreciate your business.
          </p>
          {businessInfo?.businessWebsite && (
            <p className="text-sm text-gray-500 mt-2">
              Visit us at: 
              <a 
                href={businessInfo.businessWebsite} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                {businessInfo.businessWebsite}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoice;

