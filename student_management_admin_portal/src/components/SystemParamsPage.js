import React, { useEffect, useState } from "react";
import { getToken } from "./auth";

/**
 * PUBLIC_INTERFACE
 * SystemParamsPage - attempts to fetch backend system config parameters. If endpoint not present, shows friendly UI.
 */
function SystemParamsPage() {
  // State for backend config
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Guess endpoint (common: /system-config, /config, /settings, etc)
  // In production, ideally import from config, here we try and fallback
  const ENDPOINTS = [
    "/system-config",
    "/config",
    "/system/params",
    "/admin/config",
    "/settings",
    "/admin/parameters",
    "/parameters",
  ];

  // Handle config fetching
  useEffect(() => {
    let didCancel = false;
    async function fetchConfig() {
      setLoading(true);
      setLoadError(null);
      setConfig(null);

      const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
      const token = getToken();

      // Try endpoints in order, first success wins
      for (let path of ENDPOINTS) {
        try {
          const resp = await fetch(API_BASE + path, {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
          });
          if (resp.ok) {
            const data = await resp.json();
            // Heuristic: data should be object/dict with 1+ keys
            if (
              data &&
              typeof data === "object" &&
              !Array.isArray(data) &&
              Object.keys(data).length > 0
            ) {
              if (!didCancel) {
                setConfig(data);
              }
              setLoading(false);
              return;
            }
          } else if (resp.status !== 404) {
            // If 404, continue; if other error, display
            const errData = await resp.json().catch(() => ({}));
            if (!didCancel) {
              setLoadError(
                errData.detail ||
                  resp.statusText ||
                  "Unknown error loading backend parameters"
              );
              setLoading(false);
            }
            return;
          }
          // If 404, proceed to next endpoint
        } catch (err) {
          // Network/JSON error, try next endpoint
        }
      }
      // If none succeeded, no endpoint found
      if (!didCancel) {
        setConfig(null);
        setLoading(false);
        setLoadError(null);
      }
    }
    fetchConfig();

    return () => {
      didCancel = true;
    };
    // eslint-disable-next-line
  }, []);

  if (loading)
    return (
      <section>
        <h2>System Parameters</h2>
        <div style={{ marginTop: 20, fontSize: 18 }}>Loading configuration...</div>
      </section>
    );

  if (loadError)
    return (
      <section>
        <h2>System Parameters</h2>
        <div style={{ marginTop: 20, color: "#e53935", fontWeight: 600 }}>
          Error loading configuration: {loadError}
        </div>
      </section>
    );

  if (config)
    return (
      <section>
        <h2>System Parameters</h2>
        <p style={{ color: "#388e3c", fontWeight: 600, marginTop: 0 }}>
          System configuration successfully fetched from backend.
        </p>
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--border-color, #e9ecef)",
            borderRadius: 9,
            padding: "20px 28px",
            margin: "14px 0",
            maxWidth: 600,
            fontSize: 16,
            boxShadow: "0 4px 22px rgba(75, 110, 190, 0.03)",
          }}
        >
          <dl>
            {Object.entries(config).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt
                  style={{
                    fontWeight: 600,
                    color: "#1976d2",
                    marginBottom: 2,
                    fontSize: 17,
                  }}
                >
                  {k}
                </dt>
                <dd
                  style={{
                    margin: "0 0 13px 0",
                    fontWeight: 400,
                    fontSize: 15,
                    color: "#222",
                    paddingLeft: 8,
                  }}
                >
                  {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      </section>
    );

  // Fallback - config not supported
  return (
    <section>
      <h2>System Parameters</h2>
      <div
        style={{
          marginTop: 24,
          background: "#f3f7fa",
          border: "1.5px solid #e0e0e0",
          borderRadius: 10,
          boxShadow: "0 2px 18px rgba(80,101,150,0.04)",
          padding: "36px 28px",
          maxWidth: 440,
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 10 }}>🚧</div>
        <div style={{ fontWeight: 600, fontSize: 20, color: "#888" }}>
          Configuration Not Supported
        </div>
        <div style={{ fontSize: 15, color: "#666", marginTop: 10 }}>
          This deployment does not support backend system configuration at this time.<br />
          <span style={{ fontStyle: "italic" }}>Contact your developer or administrator to enable configuration endpoints.</span>
        </div>
      </div>
    </section>
  );
}

export default SystemParamsPage;

