'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react'; // Added for password visibility

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Set authentication flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/');
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
          Sign in to access your patient dashboard
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ marginTop: '32px' }}>
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
              defaultValue="joelmachan92@gmail.com" // From image
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
                defaultValue="••••••••" // From image
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
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#2EDEA8', // Green button
              color: '#111827', // Dark text on button
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '8px',
              boxSizing: 'border-box',
            }}
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <a
            href="#"
            style={{
              color: '#E5E7EB',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Create account
          </a>
          <p
            style={{
              color: '#6B7280', // Lighter gray for disclaimer
              fontSize: '12px',
              marginTop: '16px',
              lineHeight: '1.5',
            }}
          >
            By continuing you agree to the Terms. This demo stores a token in
            localstorage only.
          </p>
        </div>
      </div>
    </div>
  );
}