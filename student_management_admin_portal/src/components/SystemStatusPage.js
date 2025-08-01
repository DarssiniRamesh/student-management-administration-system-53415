import React, { useEffect, useState } from "react";
import { getToken } from "./auth";

/**
 * PUBLIC_INTERFACE
 * SystemStatusPage - Shows system health, analytics, and backend status in a minimal dashboard view.
 * Fetches from backend endpoints: / (health), /analytics/overall, and optionally /auth/me for quick admin check.
 */
function SystemStatusPage() {
  // Dashboard states
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  // Endpoint base, token
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
  const token = getToken();

  useEffect(() => {
    let didCancel = false;
    async function fetchStatusInfo() {
      setLoading(true);
      setHealthStatus(null);
      setAnalytics(null);
      setError(null);
      try {
        // Fetch backend health
        const healthResp = await fetch(API_BASE + "/", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        let health = null;
        if (healthResp.ok) {
          try {
            health = await healthResp.json();
          } catch {
            health = { status: "healthy" };
          }
        } else {
          health = { status: "down", code: healthResp.status };
        }
        // Fetch analytics (/analytics/overall)
        const analyticsResp = await fetch(API_BASE + "/analytics/overall", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        let analyticsData = null;
        if (analyticsResp.ok) {
          analyticsData = await analyticsResp.json();
        }

        // Display result
        if (!didCancel) {
          setHealthStatus(health);
          setAnalytics(analyticsData);
          setLoading(false);
        }
      } catch (err) {
        // Catastrophic failure (e.g., network error)
        if (!didCancel) {
          setError("Failed to reach backend: " + (err.message || "Unknown error"));
          setLoading(false);
        }
      }
    }
    fetchStatusInfo();
    return () => { didCancel = true; };
    // eslint-disable-next-line
  }, []);

  return (
    <section>
      <h2>System Status</h2>
      <p style={{ marginTop: 0, color: "#666" }}>
        Quick overview of system health and attendance analytics.
      </p>
      {loading ? (
        <div style={{ marginTop: 28, fontSize: 18 }}>Loading system status...</div>
      ) : error ? (
        <div style={{
          marginTop: 32, color: "#e53935", fontWeight: 600, fontSize: 17,
          background: "#fff4f4", borderRadius: 8, padding: "18px 28px"
        }}>
          {error}
        </div>
      ) : (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 28,
          margin: "20px 0 4px 0"
        }}>
          <StatusCard
            title="Backend Health"
            value={healthStatus?.status === "healthy" || healthStatus?.status === "ok" ? "Up" : "Down"}
            color={healthStatus?.status === "healthy" || healthStatus?.status === "ok" ? "#29b651" : "#e53935"}
            subtitle={
              healthStatus?.code
                ? `Error: HTTP ${healthStatus.code}`
                : healthStatus?.details
                  ? healthStatus.details
                  : healthStatus?.status || ""
            }
            icon={healthStatus?.status === "healthy" || healthStatus?.status === "ok" ? "🟢" : "🔴"}
          />
          <StatusCard
            title="Env/Analytics"
            value={analytics ? "Available" : "Unavailable"}
            color={analytics ? "#1976d2" : "#e53935"}
            subtitle={analytics ? "Loaded" : "Not found"}
            icon={analytics ? "📊" : "⚠️"}
          />
        </div>
      )}

      {!loading && !error && (
        <div style={{ margin: "34px 0 10px 0" }}>
          {analytics ? (
            <AnalyticsStats analytics={analytics} />
          ) : (
            <div style={{
              color: "#888",
              fontSize: 16,
              marginTop: 22,
              background: "#f3f7fa",
              borderRadius: 8,
              padding: "20px 24px"
            }}>
              Analytics data not available from backend.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Simple status summary card
function StatusCard({ title, value, subtitle, color, icon }) {
  return (
    <div style={{
      minWidth: 220,
      maxWidth: 340,
      flex: 1,
      background: "#fff",
      borderRadius: 10,
      border: "1.5px solid var(--border-color, #e9ecef)",
      boxShadow: "0 2px 16px rgba(70,90,190,0.055)",
      padding: "24px 26px 14px 28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start"
    }}>
      <span style={{ fontSize: 21, color: "#888" }}>{icon} {title}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: color || "#333", margin: "5px 0 3px 0" }}>
        {value}
      </span>
      {subtitle &&
        <span style={{ fontSize: 15, color: "#666", opacity: 0.8 }}>{subtitle}</span>
      }
    </div>
  );
}

// Table or summary of analytics (students, attendance stats, etc)
function AnalyticsStats({ analytics }) {
  // Heuristics, as backend shape might be variable
  // E.g.: { total_students: 120, total_teachers: 3, total_attendance: 455, ... }
  if (!analytics || typeof analytics !== "object") return null;
  const entries = Object.entries(analytics);

  return (
    <div style={{
      maxWidth: 600,
      background: "#fff",
      borderRadius: 10,
      border: "1.5px solid var(--border-color, #e9ecef)",
      boxShadow: "0 2px 18px rgba(75,110,190,0.04)",
      padding: "20px 22px 18px 22px"
    }}>
      <h3 style={{ color: "#1976d2", fontWeight: 600, fontSize: 21, margin: 0, marginBottom: 10 }}>Attendance Analytics</h3>
      <table style={{ borderCollapse: "collapse", width: "100%", background: "none" }}>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ fontWeight: 500, color: "#444", fontSize: 16, padding: "8px 0 8px 2px", width: 180 }}>
                {formatAnalyticsKey(k)}
              </td>
              <td style={{ color: "#222", fontSize: 16, padding: "8px 6px", textAlign: "right" }}>
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper for pretty label
function formatAnalyticsKey(key) {
  // E.g. total_students -> Total Students
  return key
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, c => c.toUpperCase());
}

export default SystemStatusPage;
