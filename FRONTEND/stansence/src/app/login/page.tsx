'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp, signInWithGoogle } from '@/services/authService';

// Simple inline SVG components for icons
const PulseIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const EyeIcon = ({ ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        await signUp(email, password, displayName || undefined);
      } else {
        // Sign in existing user
        await signIn(email, password);
      }
      
      // Redirect to dashboard on success
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      // Redirect to dashboard on success
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      console.error('Google auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111827', // Dark background
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
          background: '#1F2937', // Dark card background
          borderRadius: '12px',
          color: '#E5E7EB', // Light text
          margin: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#2EDEA8', // Green accent color
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          <PulseIcon />
          <span>StanceSense</span>
        </div>
        <p style={{ marginTop: '8px', color: '#9CA3AF', fontSize: '16px' }}>
          {isSignUp ? 'Create your account' : 'Sign in to access your patient dashboard'}
        </p>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#7F1D1D',
              color: '#FEE2E2',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '32px' }}>
          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="displayName"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: '#D1D5DB',
                }}
              >
                Full Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#374151',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#D1D5DB',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #374151',
                background: '#374151', // Darker input background
                color: '#FFFFFF',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#D1D5DB',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '44px', // Space for icon
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#374151',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '12px',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#6B7280' : '#2EDEA8', // Green button
              color: '#111827', // Dark text on button
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              boxSizing: 'border-box',
            }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginTop: '24px', 
          marginBottom: '24px',
          gap: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#374151' }}></div>
          <span style={{ color: '#9CA3AF', fontSize: '14px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#374151' }}></div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #374151',
            background: '#FFFFFF',
            color: '#374151',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          {loading ? 'Please wait...' : 'Continue with Google'}
        </button>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2EDEA8',
              textDecoration: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Create account'}
          </button>
          <p
            style={{
              color: '#6B7280', // Lighter gray for disclaimer
              fontSize: '12px',
              marginTop: '16px',
              lineHeight: '1.5',
            }}
          >
            By continuing you agree to the Terms. Authentication powered by Firebase.
          </p>
        </div>
      </div>
    </div>
  );
}