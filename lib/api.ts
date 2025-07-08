// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
