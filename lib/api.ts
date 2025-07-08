// API Configuration
// Force production URL if we're in production
const getApiBaseUrl = () => {
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      hostname: window.location.hostname
    });
  }
  
  // If we're on Vercel (production), force the production URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://fixmyride-crm.onrender.com';
  }
  
  // Otherwise use environment variable or localhost fallback
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to make API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
};
