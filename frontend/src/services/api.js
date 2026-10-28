import axios from 'axios';

// Base API configuration pointing to the Laravel backend

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';


const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach bearer token if available
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

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend 404 or connection refused
    if (!error.response) {
      return Promise.reject({
        message: 'Unable to connect to the backend server. Please verify that "php artisan serve" is running at http://127.0.0.1:8000.',
        isNetworkError: true,
      });
    }

    if (error.response.status === 404) {
      return Promise.reject({
        status: 404,
        message: `Endpoint ${error.config?.url} was not found on the backend. This route needs to be implemented in Laravel.`,
        data: error.response.data,
      });
    }

    return Promise.reject(error.response.data || error);
  }
);

export const authService = {
  // Registers a new user/business account
  async register(userData) {
    return apiClient.post('/register', userData);
  },

  // Authenticates with email and password
  async login(credentials) {
    return apiClient.post('/login', credentials);
  },

  // Logs out the authenticated user
  async logout() {
    return apiClient.post('/logout');
  },

  // Gets the currently authenticated user profile
  async getCurrentUser() {
    return apiClient.get('/user');
  },

  // Request password reset token/link
  async forgotPassword(email) {
    return apiClient.post('/forgot-password', { email });
  },

  // Reset password using token
  async resetPassword(payload) {
    return apiClient.post('/reset-password', payload);
  },
};

export const dashboardService = {
  // Get aggregated metrics and charts
  async getStats(days = 30) {
    return apiClient.get(`/dashboard/stats?days=${days}`);
  },

  // Get user's feedback forms
  async getForms(params = {}) {
    return apiClient.get('/forms', { params });
  },

  // Get customer submissions / responses
  async getResponses(params = {}) {
    return apiClient.get('/responses', { params });
  },

  // Get single response detail with ownership check
  async getResponseDetails(id) {
    return apiClient.get(`/responses/${id}`);
  },

  // Get responses for a specific owned form
  async getFormResponses(formId, params = {}) {
    return apiClient.get(`/forms/${formId}/responses`, { params });
  },

  // Create a new feedback form
  async createForm(formData) {
    return apiClient.post('/forms', formData);
  },

  // Delete a feedback form
  async deleteForm(id) {
    return apiClient.delete(`/forms/${id}`);
  },

  // Delete a customer response
  async deleteResponse(id) {
    return apiClient.delete(`/responses/${id}`);
  },
};

export const formBuilderService = {
  // Get full nested form structure
  async getForm(id) {
    return apiClient.get(`/forms/${id}`);
  },

  // Save/Update full nested form structure (draft or published)
  async saveForm(formData) {
    return apiClient.post('/forms/builder', formData);
  },

  // Toggle status (draft, published, unpublished)
  async updateStatus(id, status) {
    return apiClient.patch(`/forms/${id}/status`, { status });
  },

  // Public form access by slug
  async getPublicForm(slug, params = {}) {
    return apiClient.get(`/public/forms/${slug}`, { params });
  },

  // Public form submission
  async submitFeedback(slug, data) {
    return apiClient.post(`/public/forms/${slug}/submit`, data);
  },
};

export const adminService = {
  // Get platform-wide aggregated metrics
  async getStats(days = 30) {
    return apiClient.get(`/admin/stats?days=${days}`);
  },

  // Get all platform users with counts and filters
  async getUsers(params = {}) {
    return apiClient.get('/admin/users', { params });
  },

  // Get full user details with created forms and customer responses
  async getUserDetails(id) {
    return apiClient.get(`/admin/users/${id}`);
  },

  // Get featured / top active users for sidebar navigation
  async getFeaturedUsers(limit = 5) {
    return apiClient.get(`/admin/featured-users?limit=${limit}`);
  },

  // Update user role (user <-> admin)
  async updateUserRole(id, role) {
    return apiClient.patch(`/admin/users/${id}/role`, { role });
  },

  // Delete user account
  async deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`);
  },

  // Get all forms across all platform tenants
  async getForms(params = {}) {
    return apiClient.get('/admin/forms', { params });
  },

  // Superadmin form deletion
  async deleteForm(id) {
    return apiClient.delete(`/admin/forms/${id}`);
  },

  // Get all responses across all platform tenants
  async getResponses(params = {}) {
    return apiClient.get('/admin/responses', { params });
  },

  // Superadmin response deletion
  async deleteResponse(id) {
    return apiClient.delete(`/admin/responses/${id}`);
  },
};

export default apiClient;

