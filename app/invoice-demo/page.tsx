"use client"

import React from "react";
import Invoice from "../../components/invoice";

export default function InvoiceDemoPage() {
  // Mock service request data
  const mockServiceRequest = {
    _id: "64abc123def456",
    customerName: "Rajesh Kumar",
    customerPhone: "+91 9876543210",
    vehicle: "Honda Activa 6G",
    serviceType: "Engine Repair",
    issue: "Engine not starting properly, unusual noise from engine compartment",
    cost: 2500,
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T16:45:00Z",
    status: "Completed" as const,
    priority: "Medium" as const,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // This would typically generate a PDF
    alert("Download PDF functionality would be implemented here");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Invoice Demo</h1>
          <p className="text-gray-600">This is how customers would see their service invoice</p>
        </div>

        <Invoice
          serviceRequest={mockServiceRequest}
          invoiceNumber="INV-2024-001"
          onPrint={handlePrint}
          onDownload={handleDownload}
        />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This invoice component integrates your business information automatically</p>
          <p>and provides a professional receipt for your customers.</p>
        </div>
      </div>
    </div>
  );
}
