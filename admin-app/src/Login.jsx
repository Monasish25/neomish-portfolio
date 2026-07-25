import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { logActivity } from "./activityLogger";
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin, externalError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(externalError || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      logActivity("Login", `Logged in as ${email}`);
      onLogin(data.user);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <video autoPlay loop muted playsInline className="login-bg-video">
        <source src="https://dpqvnbgwjltkfwzbuoet.supabase.co/storage/v1/object/public/assets/login_background.mp4" type="video/mp4" />
      </video>
      <div className="login-card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="login-header">
          <div className="login-logo">
            <span className="login-dot" />
            <span>Neomish</span>
          </div>
          <h1>Admin Access</h1>
          <p>Sign in to manage your portfolio projects.</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="login-form">
          <div className="login-field">
            <label>
              <Mail size={14} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label>
              <Lock size={14} />
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn login-btn-primary" disabled={loading}>
            <LogIn size={16} />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="login-btn login-btn-google"
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="login-footer">
          Access is restricted to the portfolio owner.
          <br />
          No public sign-up available.
        </p>
      </div>
    </div>
  );
}
