"use client";
import React, { useState } from "react";
import { X, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { AUTH_ROLE_KEY, AUTH_TOKEN_KEY, homeRouteFor, type Role } from "@/components/ui/nav-config";

interface LoginModalProps {
  isLoginModalOpen: boolean;
  closeLoginModal: () => void;
}

export function LoginModal({ isLoginModalOpen, closeLoginModal }: LoginModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setRedirectNotice(null);

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email/username and password.");
      return;
    }

    setIsLoading(true);

    try {
      let role: Role | null = null;
      let token: string | null = null;

      // Lưu ý: Vẫn giữ lại Mock Logic theo yêu cầu để bật/tắt dự phòng
      const useMock = process.env.NEXT_PUBLIC_USE_MOCK_LOGIN === "true";

      if (useMock) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const normalized = identifier.trim().toLowerCase();
        if ((normalized === "student@academic.edu.vn" || normalized === "student") && password === "Student@123") {
          role = "student";
        } else if ((normalized === "admin@academic.edu.vn" || normalized === "admin") && password === "Admin@123") {
          role = "admin";
        } else if ((normalized === "teacher@academic.edu.vn" || normalized === "teacher") && password === "Teacher@123") {
          role = "trainer";
        }
        if (role) token = "demo-token";
      } else {
        // Gọi API thật tới Backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        if (res.ok) {
          const data = await res.json();
          role = data.role as Role;
          token = data.token;
        }
      }

      if (role && token) {
        setRedirectNotice("Login successful! Redirecting...");
        setTimeout(() => {
          localStorage.setItem(AUTH_TOKEN_KEY, token as string);
          localStorage.setItem(AUTH_ROLE_KEY, role as string);
          // Set cookie for Next.js Middleware
          document.cookie = `${AUTH_ROLE_KEY}=${role}; path=/`;
          document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/`;
          window.location.assign(homeRouteFor(role as Role));
        }, 700);
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <>
      {/* COURSERA EXACT POPUP MODAL (ENHANCED TYPOGRAPHY & SPACING) */}
      {isLoginModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
            padding: '16px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal(); }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              background: 'linear-gradient(to bottom, #dbeafe 0%, #eff6ff 18%, #ffffff 55%)',
              borderRadius: '12px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              padding: '40px 36px 36px',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeLoginModal}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
              }}
            >
              <X style={{ width: '22px', height: '22px' }} />
            </button>

            {/* Header */}
            <h2
              style={{
                textAlign: 'center',
                fontSize: '26px',
                fontWeight: 700,
                color: '#1f1f1f',
                marginBottom: '28px',
                letterSpacing: '-0.3px',
              }}
            >
              Login
            </h2>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#dc2626',
                }}
              >
                <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {redirectNotice && (
              <div
                role="status"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#1d4ed8',
                }}
              >
                <Loader2 style={{ width: '18px', height: '18px', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: 600 }}>{redirectNotice}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} noValidate>
              {/* Username / Email */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1f1f1f',
                    marginBottom: '6px',
                  }}
                >
                  Username or Email
                  <span style={{ color: '#e8175d', display: 'inline', marginLeft: '3px' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@email.com"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '13px 14px',
                    fontSize: '15px',
                    color: '#1f1f1f',
                    outline: 'none',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0056D2')}
                  onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1f1f1f',
                    marginBottom: '6px',
                  }}
                >
                  Password
                  <span style={{ color: '#e8175d', display: 'inline', marginLeft: '3px' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '13px 44px 13px 14px',
                      fontSize: '15px',
                      color: '#1f1f1f',
                      outline: 'none',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0056D2')}
                    onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: '18px', height: '18px' }} />
                      : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: isLoading ? '#6b9fd4' : '#0056D2',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: "'Poppins', sans-serif",
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { if (!isLoading) (e.currentTarget.style.backgroundColor = '#00419e'); }}
                onMouseLeave={(e) => { if (!isLoading) (e.currentTarget.style.backgroundColor = '#0056D2'); }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            {/* Admin-only notice */}
            <p
              style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '12.5px',
                color: '#6b7280',
                lineHeight: 1.6,
              }}
            >
              Don&apos;t have an account?{' '}
              <span style={{ color: '#1f1f1f', fontWeight: 600 }}>
                Account creation is restricted to administrators only.
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
