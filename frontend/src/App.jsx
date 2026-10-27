import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import FormsPage from './pages/dashboard/FormsPage';
import ResponsesPage from './pages/dashboard/ResponsesPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import CreateFormPage from './pages/dashboard/CreateFormPage';
import PublicFeedbackForm from './pages/PublicFeedbackForm';

import AdminLogin from './pages/admin/AdminLogin';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminFormsPage from './pages/admin/AdminFormsPage';
import AdminResponsesPage from './pages/admin/AdminResponsesPage';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage';

// Public layout with FeedbackHub marketing navbar and footer
function PublicLayout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Marketing & Auth Pages */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
          <Route path="/reset-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />

          {/* Protected Dashboard SaaS Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/forms"
            element={
              <ProtectedRoute>
                <FormsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/forms/create"
            element={
              <ProtectedRoute>
                <CreateFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/forms/:id/edit"
            element={
              <ProtectedRoute>
                <CreateFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/responses"
            element={
              <ProtectedRoute>
                <ResponsesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/forms/:id/responses"
            element={
              <ProtectedRoute>
                <ResponsesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Superadmin Authentication Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Superadmin Platform Management Portal */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:id" element={<AdminUserDetailsPage />} />
            <Route path="forms" element={<AdminFormsPage />} />
            <Route path="responses" element={<AdminResponsesPage />} />
          </Route>

          {/* Public Customer Feedback Form Submission Portal - Clean Distraction-Free Layout */}
          <Route 
            path="/f/:slug" 
            element={<PublicFeedbackForm />} 
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
