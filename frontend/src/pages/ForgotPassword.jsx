import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  KeyRound,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { authService } from '../services/api';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle password change submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your new password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsLoading(false);
      setIsSuccess(true);
    } catch (err) {
      setIsLoading(false);
      const msg = 
        err.response?.data?.errors?.email?.[0] || 
        err.response?.data?.message || 
        err.message || 
        'Unable to change password. Please check your email and try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          {/* Header */}
          <div className="auth-header">
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <KeyRound size={24} />
            </div>

            <h1 className="auth-title">
              {isSuccess ? 'Password Changed!' : 'Change Password'}
            </h1>
            <p className="auth-subtitle">
              {isSuccess 
                ? 'Your password has been changed successfully.' 
                : 'Enter your email address, new password, and confirm password to reset.'}
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">
                  Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  New Password
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-new-password">
                  Confirm Password
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Confirm new password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading}
                style={{ marginTop: '16px' }}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Changing Password...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Change Password</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link to="/login" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={16} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          ) : (
            /* Success Screen */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.6' }}>
                Your password for <strong>{email}</strong> has been updated. You can now sign in with your new credentials.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-block btn-lg"
              >
                <span>Sign In Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
