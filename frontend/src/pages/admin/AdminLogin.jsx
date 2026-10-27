import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  LogIn
} from 'lucide-react';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import logoIcon from '../../assets/logo-icon.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();

  // If already logged in as administrator, navigate directly to Admin Dashboard
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const [formData, setFormData] = useState({
    email: 'admin@gmail.com',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Administrator email is required.';
    }
    if (!formData.password) {
      newErrors.password = 'Administrator password is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const { token, user } = response.data || {};

      if (!token || !user) {
        setApiError('Invalid authentication response from server.');
        return;
      }

      // Verify that this account is an administrator
      if (user.role !== 'admin') {
        setApiError('Access Denied: This account does not possess platform administrator privileges.');
        return;
      }

      // Set auth state
      login(token, user);

      // Redirect directly to the Admin Dashboard
      const destination = location.state?.from?.pathname || '/admin/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      if (err.status === 401 || err.message?.toLowerCase().includes('credentials')) {
        setApiError('Invalid administrator email or password.');
      } else {
        setApiError(err.message || 'Unable to connect to administration service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #081B43 0%, #061536 60%, #020617 100%)',
      padding: '1.5rem',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(27, 144, 111, 0.3)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 50px -10px rgba(27, 144, 111, 0.25)'
      }}>
        {/* Brand Shield & Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #081B43 0%, #1B906F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 8px 24px rgba(27, 144, 111, 0.4)',
            padding: '8px'
          }}>
            <img
              src={logoIcon}
              alt="FeedbackHub"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            <span style={{ color: '#ffffff' }}>Feedback</span>
            <span style={{ color: '#1B906F' }}>Hub</span>{' '}
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>Admin</span>
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
            Restricted area. Authorized platform administrators only.
          </p>
        </div>

        {/* API Error Box */}
        {apiError && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            lineHeight: 1.45
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Admin Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@gmail.com"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem 0.65rem 2.4rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #334155',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {errors.email && (
              <span style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '4px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Admin Password */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 2.4rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: errors.password ? '1px solid #ef4444' : '1px solid #334155',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '4px', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #1B906F 0%, #0284c7 100%)',
              color: '#ffffff',
              fontSize: '0.925rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(27, 144, 111, 0.35)',
              transition: 'opacity 0.2s ease'
            }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={17} />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
          FeedbackHub Platform Security • Restricted Administrative System
        </div>
      </div>
    </div>
  );
}
