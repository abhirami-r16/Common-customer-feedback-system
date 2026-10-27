import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  LogIn as LogInIcon, 
  ArrowRight,
  Info
} from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  // Redirect already authenticated users to their respective dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Success message passed from registration
  const successMessage = location.state?.registeredMessage || null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Connect to the actual Laravel login endpoint
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
        remember: formData.remember,
      });

      if (response.data?.token && response.data?.user) {
        const authUser = response.data.user;
        login(response.data.token, authUser);

        // Separate dashboards: Admin goes to /admin, Owner goes to /dashboard
        const requestedPath = location.state?.from?.pathname;
        let destination;

        if (authUser.role === 'admin') {
          // Admin credentials -> Admin Dashboard
          destination = (requestedPath && requestedPath.startsWith('/admin')) ? requestedPath : '/admin/dashboard';
        } else {
          // Business credentials -> Business Customer Dashboard
          destination = (requestedPath && !requestedPath.startsWith('/admin')) ? requestedPath : '/dashboard';
        }

        navigate(destination, { replace: true });
      } else {
        setApiError({
          title: 'Authentication Response Error',
          message: 'The server response did not include a valid authorization token.',
        });
      }
    } catch (err) {
      if (err.status === 404 || err.message?.includes('was not found')) {
        setApiError({
          title: 'Backend Route Not Implemented (404)',
          message: 'The login API endpoint (POST /api/login) has not been implemented in Laravel yet. In accordance with system instructions, we report this real state rather than faking authentication.',
          missingRoute: true,
        });
      } else if (err.status === 401 || err.message?.toLowerCase().includes('credentials')) {
        setApiError({
          title: 'Invalid Credentials',
          message: 'The email or password you entered is incorrect. Please try again.',
        });
      } else if (err.errors) {
        const laravelErrors = {};
        Object.keys(err.errors).forEach((key) => {
          laravelErrors[key] = err.errors[key][0];
        });
        setErrors(laravelErrors);
      } else {
        setApiError({
          title: 'Sign In Failed',
          message: err.message || 'Unable to connect to the authentication server.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your FeedbackHub account</p>
        </div>

        {/* Success Alert (e.g. from registration) */}
        {successMessage && (
          <div className="alert alert-success" role="status">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* API Error Notification */}
        {apiError && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>{apiError.title}</strong>
              <p style={{ marginTop: '4px', fontSize: '0.86rem', lineHeight: '1.45' }}>
                {apiError.message}
              </p>
              {apiError.missingRoute && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#7f1d1d' }}>
                  <strong>Next action needed on backend:</strong> Add <code>Route::post('/login', [AuthController::class, 'login'])</code> in <code>routes/api.php</code>.
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="form-input-wrapper">
              <input
                id="login-email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'has-error' : ''}`}
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'has-error' : ''}`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="auth-options-row">
            <label className="checkbox-label" htmlFor="remember">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="checkbox-input"
                checked={formData.remember}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>

            <Link 
              to="/forgot-password" 
              className="text-link"
              style={{ fontSize: '0.85rem' }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogInIcon size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
