import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    organization_name: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms_accepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field-specific error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Business or organization name is required.';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password.';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match.';
    }

    if (!formData.terms_accepted) {
      newErrors.terms_accepted = 'You must agree to the Terms and Conditions to proceed.';
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
      // Connect to the actual Laravel registration endpoint
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        organization_name: formData.organization_name.trim(),
      };

      const response = await authService.register(payload);

      // If backend returns auth token and user
      if (response.data?.token && response.data?.user) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        // Fallback if registration succeeded without automatic login token
        navigate('/login', { state: { registeredMessage: 'Registration successful! Please log in.' } });
      }
    } catch (err) {
      // Handle missing endpoint or backend validation errors
      if (err.status === 404 || err.message?.includes('was not found')) {
        setApiError({
          title: 'Backend Route Not Implemented (404)',
          message: 'The registration API endpoint (POST /api/register) has not been implemented in Laravel yet. In accordance with system instructions, we report this real state rather than faking registration.',
          missingRoute: true,
        });
      } else if (err.errors) {
        // Laravel validation error response (422)
        const laravelErrors = {};
        Object.keys(err.errors).forEach((key) => {
          laravelErrors[key] = err.errors[key][0];
        });
        setErrors(laravelErrors);
        setApiError({
          title: 'Validation Failed',
          message: err.message || 'Please correct the highlighted fields below.',
        });
      } else {
        setApiError({
          title: 'Registration Error',
          message: err.message || 'An unexpected error occurred while communicating with the backend server.',
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start collecting actionable customer feedback</p>
        </div>

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
                  <strong>Next action needed on backend:</strong> Add <code>Route::post('/register', [AuthController::class, 'register'])</code> in <code>routes/api.php</code>.
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Organization / Business Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="organization_name">
              Business or Organization Name
            </label>
            <div className="form-input-wrapper">
              <input
                id="organization_name"
                name="organization_name"
                type="text"
                className={`form-input ${errors.organization_name ? 'has-error' : ''}`}
                placeholder="e.g. Acme Retail or TechStudio"
                value={formData.organization_name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.organization_name && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors.organization_name}</span>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="form-input-wrapper">
              <input
                id="name"
                name="name"
                type="text"
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                placeholder="e.g. Jane Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Work Email Address
            </label>
            <div className="form-input-wrapper">
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'has-error' : ''}`}
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
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
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'has-error' : ''}`}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
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

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password_confirmation">
              Confirm Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input ${errors.password_confirmation ? 'has-error' : ''}`}
                placeholder="Re-enter your password"
                value={formData.password_confirmation}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors.password_confirmation}</span>
              </div>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="form-group">
            <label className="checkbox-label" htmlFor="terms_accepted">
              <input
                id="terms_accepted"
                name="terms_accepted"
                type="checkbox"
                className="checkbox-input"
                checked={formData.terms_accepted}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span>
                I agree to the <a href="#terms" className="auth-link">Terms and Conditions</a> and{' '}
                <a href="#privacy" className="auth-link">Privacy Policy</a>
              </span>
            </label>
            {errors.terms_accepted && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{errors.terms_accepted}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
