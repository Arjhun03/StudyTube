import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Youtube, Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getFirebaseErrorMessage } from '../firebase/errors/firebaseError';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, forgotPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const state = location.state as { redirectTo?: string; url?: string; verifyEmail?: boolean } | null;
  const redirectTo = state?.redirectTo || '/dashboard';

  /* ---------- mode helpers ---------- */
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  /* ---------- Google ---------- */
  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate(redirectTo, { state: { url: state?.url } });
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ---------- Email / password submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Client-side validations
    if (mode === 'signup') {
      if (displayName.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please check and try again.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUp({ email, password, displayName: displayName.trim() });
        // Stay on Auth — show verification prompt, do NOT navigate
        setMessage('Account created! Please check your inbox and verify your email before signing in.');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        switchMode('signin');
        setMessage('Account created! Check your inbox to verify your email, then sign in.');
      } else {
        await signIn({ email, password });
        navigate(redirectTo, { state: { url: state?.url } });
      }
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Forgot password ---------- */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = submitting || googleLoading;

  /* ---------- Shared input style helpers ---------- */
  const inputWrapStyle: React.CSSProperties = { position: 'relative' };
  const iconStyle: React.CSSProperties = {
    position: 'absolute', left: '14px', top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-muted)',
    pointerEvents: 'none',
  };
  const inputStyle: React.CSSProperties = { paddingLeft: '44px', width: '100%' };
  const eyeStyle: React.CSSProperties = {
    position: 'absolute', right: '14px', top: '50%',
    transform: 'translateY(-50%)', background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
    display: 'flex', alignItems: 'center',
  };

  return (
    <div
      className="app-container flex-center"
      style={{ minHeight: '100vh', padding: '24px', backgroundColor: 'var(--bg-main)', position: 'relative' }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'none', border: 'none', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: 'pointer', fontWeight: 500, fontSize: '14px',
        }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px' }}>

        {/* Logo + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: 'white', borderRadius: '12px', padding: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
          }}>
            <Youtube size={32} />
          </div>
          <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '6px' }}>
            {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
            {mode === 'signup'
              ? 'Sign up to start converting study materials'
              : mode === 'forgot'
              ? 'Enter your email to receive a reset link'
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            backgroundColor: 'hsla(0, 84%, 60%, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            color: 'var(--danger)', fontSize: '14px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success / Info Banner */}
        {(message || state?.verifyEmail) && (
          <div style={{
            backgroundColor: 'hsla(142, 70%, 45%, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            color: 'var(--success)', fontSize: '14px',
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{message ?? 'Please verify your email before signing in.'}</span>
          </div>
        )}

        {/* ===== FORGOT PASSWORD FORM ===== */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={inputWrapStyle}>
                <Mail size={18} style={iconStyle} />
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={inputStyle}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('signin')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* ===== SIGN IN / SIGN UP FORM ===== */}
        {mode !== 'forgot' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Name — sign-up only */}
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={inputWrapStyle}>
                  <User size={18} style={iconStyle} />
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-input"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={inputWrapStyle}>
                <Mail size={18} style={iconStyle} />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={inputWrapStyle}>
                <Lock size={18} style={iconStyle} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                />
                <button
                  type="button"
                  style={eyeStyle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password — sign-up only */}
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={inputWrapStyle}>
                  <Lock size={18} style={iconStyle} />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    style={{ ...inputStyle, paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    style={eyeStyle}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Inline mismatch hint */}
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>
                    Passwords do not match.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '4px' }}
            >
              {submitting
                ? 'Processing…'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </button>

            {/* Forgot password link — sign-in only */}
            {mode === 'signin' && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => switchMode('forgot')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--primary)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13px',
                  textAlign: 'center', width: '100%',
                }}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-muted)' }}>
              <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              <span style={{ padding: '0 12px', fontSize: '13px' }}>or</span>
              <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            </div>

            {/* Google Sign-In */}
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '12px' }}
            >
              {googleLoading ? 'Opening Google…' : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </>
        )}

        {/* Mode toggle footer */}
        {mode !== 'forgot' && (
          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--primary)', cursor: 'pointer',
                fontWeight: 600, padding: 0,
              }}
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
