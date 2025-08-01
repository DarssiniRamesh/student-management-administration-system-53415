import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Login page for admin users (JWT authentication against backend)
 * Props:
 *   onLogin: function(token, user) - called on successful login
 *   error: string - error message to display
 */
function Login({ onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  // PUBLIC_INTERFACE
  // Submits login credentials to backend and invokes onLogin if successful
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    try {
      const resp = await fetch(
        process.env.REACT_APP_BACKEND_URL
          ? process.env.REACT_APP_BACKEND_URL + "/auth/token"
          : "/auth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
        }
      );

      let data = null;
      let errorMsg = "";
      try {
        data = await resp.json();
      } catch (jsonErr) {
        // JSON parse failed (possibly a 500/error page/non-JSON response)
        if (resp.status >= 500) {
          errorMsg = "Internal server error. Please try again later or contact support.";
        } else {
          errorMsg = "Unexpected server response. Please try again.";
        }
      }

      if (resp.ok && data && data.access_token) {
        // save token + user to caller (App)
        onLogin(data.access_token, data.user || {});
      } else {
        if (!errorMsg) {
          // If JSON parsed, try to extract error info, else fallback
          errorMsg =
            (data && (data.detail || data.message)) ||
            (resp.status === 500
              ? "Internal server error. Please try again later or contact support."
              : resp.status === 0
              ? "Network error or server unavailable."
              : "Invalid credentials or login failed.");
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      onLogin(null, null, err.message || "Login failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-secondary, #f8f9fa)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          minWidth: 320,
          background: "#fff",
          borderRadius: 12,
          padding: "36px 26px 28px 26px",
          boxShadow: "0 4px 20px rgba(75, 110, 190, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          border: "1.5px solid var(--border-color, #e9ecef)",
        }}
      >
        <h2
          style={{
            marginBottom: 6,
            color: "#1976d2",
            fontWeight: 700,
            fontSize: "2rem",
            letterSpacing: ".03em",
            textAlign: "center",
          }}
        >
          Admin Login
        </h2>
        <label style={{ fontSize: 15, fontWeight: 600 }}>
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              marginTop: 4,
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontSize: 15,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ fontSize: 15, fontWeight: 600 }}>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              marginTop: 4,
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontSize: 15,
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 14,
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 16,
            padding: "10px 0",
            cursor: "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Logging in..." : "Sign In"}
        </button>
        {error && (
          <div
            style={{
              color: "#e53935",
              marginTop: 2,
              fontWeight: 500,
              textAlign: "center",
              fontSize: "1rem",
            }}
            role="alert"
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
