
import axios from 'axios';

// Base API configuration for the deployed Node.js backend
const API_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://common-customer-feedback-system-1od.vercel.app/api'
).replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Attach bearer token to requests when available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('feedbackhub_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error, CORS error, timeout, or unavailable server
    if (!error.response) {
      return Promise.reject({
        message:
          error.code === 'ECONNABORTED'
            ? 'The request timed out. Please try again.'
            : 'Unable to connect to the backend server. Please check the API URL, network connection, and backend logs.',
        isNetworkError: true,
        code: error.code,
      });
    }

    const status = error.response.status;
    const responseData = error.response.data;

    if (status === 404) {
      return Promise.reject({
        status,
        message:
          responseData?.message ||
          `API endpoint ${error.config?.url} was not found. Verify that the route exists in the Node.js backend.`,
        data: responseData,
      });
    }

    if (status === 401) {
      return Promise.reject({
        status,
        message:
          responseData?.message ||
          'Authentication failed. Please log in again.',
        data: responseData,
      });
    }

    if (status === 403) {
      return Promise.reject({
        status,
        message:
          responseData?.message ||
          'You do not have permission to perform this action.',
        data: responseData,
      });
    }

    return Promise.reject({
      status,
      message:
        responseData?.message ||
        responseData?.error ||
        'Something went wrong. Please try again.',
      data: responseData,
    });
  }
);

// Authentication services
export const authService = {
  async register(userData) {
    return apiClient.post('/register', userData);
  },

  async login(credentials) {
    return apiClient.post('/login', credentials);
  },

  async logout() {
    return apiClient.post('/logout');
  },

  async getCurrentUser() {
    return apiClient.get('/user');
  },

  async forgotPassword(email) {
    return apiClient.post('/forgot-password', { email });
  },

  async resetPassword(payload) {
    return apiClient.post('/reset-password', payload);
  },
};

// Dashboard, forms, and responses
export const dashboardService = {
  async getStats(days = 30) {
    return apiClient.get('/dashboard/stats', {
      params: { days },
    });
  },

  async getForms(params = {}) {
    return apiClient.get('/forms', { params });
  },

  async getResponses(params = {}) {
    return apiClient.get('/responses', { params });
  },

  async getResponseDetails(id) {
    return apiClient.get(`/responses/${id}`);
  },

  async getFormResponses(formId, params = {}) {
    return apiClient.get(`/forms/${formId}/responses`, {
      params,
    });
  },

  async createForm(formData) {
    return apiClient.post('/forms', formData);
  },

  async deleteForm(id) {
    return apiClient.delete(`/forms/${id}`);
  },

  async deleteResponse(id) {
    return apiClient.delete(`/responses/${id}`);
  },
};

// Feedback form builder and public form services
export const formBuilderService = {
  async getForm(id) {
    return apiClient.get(`/forms/${id}`);
  },

  async saveForm(formData) {
    return apiClient.post('/forms/builder', formData);
  },

  async updateStatus(id, status) {
    return apiClient.patch(`/forms/${id}/status`, { status });
  },

  async getPublicForm(slug, params = {}) {
    return apiClient.get(`/public/forms/${slug}`, {
      params,
    });
  },

  async submitFeedback(slug, data) {
    return apiClient.post(`/public/forms/${slug}/submit`, data);
  },
};

// Admin services
export const adminService = {
  async getStats(days = 30) {
    return apiClient.get('/admin/stats', {
      params: { days },
    });
  },

  async getUsers(params = {}) {
    return apiClient.get('/admin/users', { params });
  },

  async getUserDetails(id) {
    return apiClient.get(`/admin/users/${id}`);
  },

  async getFeaturedUsers(limit = 5) {
    return apiClient.get('/admin/featured-users', {
      params: { limit },
    });
  },

  async updateUserRole(id, role) {
    return apiClient.patch(`/admin/users/${id}/role`, { role });
  },

  async deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`);
  },

  async getForms(params = {}) {
    return apiClient.get('/admin/forms', { params });
  },

  async deleteForm(id) {
    return apiClient.delete(`/admin/forms/${id}`);
  },

  async getResponses(params = {}) {
    return apiClient.get('/admin/responses', { params });
  },

  async deleteResponse(id) {
    return apiClient.delete(`/admin/responses/${id}`);
  },
};

export default apiClient;
