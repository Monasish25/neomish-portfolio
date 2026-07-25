import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Login from "./Login";
import Dashboard from "./Dashboard";

const ALLOWED_EMAIL = "monasish25@gmail.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(() => {
    const saved = localStorage.getItem("auth_error");
    if (saved) localStorage.removeItem("auth_error");
    return saved || "";
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check for OAuth errors in the URL hash
    const hash = window.location.hash;
    if (hash.includes("error_description=")) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get("error_description");
      if (errorDesc) {
        const msg = decodeURIComponent(errorDesc).replace(/\+/g, " ");
        setAuthError(`Login Failed: ${msg}`);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }

    const verifyAndSetUser = async (sessionUser) => {
      if (sessionUser) {
        if (sessionUser.email === ALLOWED_EMAIL) {
          setUser(sessionUser);
        } else {
          // Unauthorized email! Kick them out.
          const msg = `Access Denied: The account ${sessionUser.email} is not authorized.`;
          localStorage.setItem("auth_error", msg);
          setAuthError(msg);
          setUser(null);
          // Fire and forget signout so it doesn't block UI state
          supabase.auth.signOut().catch(console.error);
        }
      } else {
        setUser(null);
      }
    };

    // Check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthError(error.message);
      }
      verifyAndSetUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (handles OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        verifyAndSetUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} externalError={authError} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
