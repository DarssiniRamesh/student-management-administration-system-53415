import React, { useEffect, useState } from "react";
import { getToken, getUser } from "./auth";

/**
 * PUBLIC_INTERFACE
 * Operators Management Page - list, add, edit, and delete operators (users with role 'admin' or 'operator')
 * Leverages backend /users/ endpoint.
 */
function OperatorsPage() {
  // Operators state
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filter/search state
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("admin");
  
  // Modal and form state for add/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null); // null or operator obj
  const [formState, setFormState] = useState({ full_name: "", email: "", role: "admin", password: "" });
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deletePending, setDeletePending] = useState(false);

  // API base URL config
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "";
  const userToken = getToken();

  // Built-in role options for operator management
  // (Assume operator roles are "admin" and possibly "operator"--if confirmed by backend spec, otherwise just "admin" here)
  const ROLE_OPTIONS = [
    { label: "Admin", value: "admin" },
    { label: "Operator", value: "operator" }
  ];

  // Fetch operator users (with filter)
  const fetchOperators = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      let url = `${API_BASE}/users/?role=${encodeURIComponent(filterRole)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const resp = await fetch(url, {
        headers: { "Authorization": `Bearer ${userToken}` }
      });
      if (resp.status === 401) {
        setFetchError("Session expired. Please log in again.");
        setOperators([]);
        return;
      }
      if (!resp.ok) {
        let errMsg;
        try {
          const data = await resp.json();
          errMsg = data.detail || data.message || resp.statusText;
        } catch {
          errMsg = resp.statusText;
        }
        throw new Error(`Failed to fetch: ${errMsg}`);
      }
      const data = await resp.json();
      setOperators(data);
    } catch (err) {
      setFetchError(err.message || "Error fetching operators");
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchOperators(); /* eslint-disable-next-line */ }, [filterRole, search]);

  // Open add operator modal
  const openAddModal = () => {
    setEditingOperator(null);
    setFormState({ full_name: "", email: "", role: filterRole, password: "" });
    setFormError("");
    setModalOpen(true);
  };
  // Open edit operator modal
  const openEditModal = (op) => {
    setEditingOperator(op);
    setFormState({ full_name: op.full_name, email: op.email, role: op.role, password: "" }); // Don't pre-fill password
    setFormError("");
    setModalOpen(true);
  };

  // Handle add/edit form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormPending(true);

    const { full_name, email, role, password } = formState;
    // Form validation
    if (!full_name || !email || !role || (!editingOperator && !password)) {
      setFormError("All fields (including password for new) are required.");
      setFormPending(false);
      return;
    }
    try {
      if (editingOperator) {
        // EDIT: Only allow full_name/password update. Email/role NOT updatable for operator.
        const body = { full_name: full_name, password: password || null };
        const resp = await fetch(`${API_BASE}/auth/me`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${userToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        if (resp.status === 401) {
          setFormError("Session expired. Please log in again.");
          setFormPending(false);
          return;
        }
        if (!resp.ok) {
          let errdata;
          try { errdata = await resp.json(); } catch { errdata = {}; }
          throw new Error(errdata.detail || "Failed to update operator");
        }
        setFormSuccess("Operator updated successfully");
        setTimeout(() => {
          setModalOpen(false);
          fetchOperators();
          setFormSuccess("");
        }, 1000);
      } else {
        // ADD
        const resp = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${userToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email, full_name, role, password })
        });
        if (resp.status === 401) {
          setFormError("Session expired. Please log in again.");
          setFormPending(false);
          return;
        }
        if (!resp.ok) {
          let errdata;
          try { errdata = await resp.json(); } catch { errdata = {}; }
          throw new Error(errdata.detail || "Failed to add operator");
        }
        setFormSuccess("Operator added successfully");
        setTimeout(() => {
          setModalOpen(false);
          fetchOperators();
          setFormSuccess("");
        }, 1000);
      }
    } catch (err) {
      setFormError(err.message || "Failed to submit");
    } finally {
      setFormPending(false);
    }
  };

  // Delete operator
  const handleDelete = async (operator) => {
    if (!window.confirm(`Delete operator "${operator.full_name}"? This cannot be undone.`)) return;
    setDeletePending(operator.id);
    try {
      const resp = await fetch(`${API_BASE}/users/${operator.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${userToken}` }
      });
      if (resp.status === 401) {
        alert("Session expired. Please log in again.");
        setDeletePending(false);
        return;
      }
      if (!resp.ok) {
        let errdata;
        try { errdata = await resp.json(); } catch { errdata = {}; }
        throw new Error(errdata.detail || "Failed to delete operator");
      }
      fetchOperators();
    } catch (err) {
      alert(err.message || "Failed to delete operator");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <section>
      <h2>Operators Management</h2>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 18 }}>
        {/* Filter role */}
        <label style={{ fontSize: 15 }}>
          Role:
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            style={{ marginLeft: 6, padding: "5px 12px", borderRadius: 6, border: "1px solid #ccc" }}
          >
            {ROLE_OPTIONS.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
        </label>
        {/* Search box */}
        <input
          aria-label="Search operators"
          placeholder="Search name/email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontSize: 15, minWidth: 140, padding: "5px 10px", border: "1px solid #eee", borderRadius: 6 }}
        />
        {/* Add button */}
        <button
          style={{
            marginLeft: "auto", background: "#1976d2", color: "#fff", border: "none", borderRadius: 7,
            fontWeight: 600, fontSize: 15, padding: "9px 30px", cursor: "pointer"
          }}
          onClick={openAddModal}
        >Add Operator</button>
      </div>

      {/* Table */}
      {loading
        ? <div style={{ fontSize: 18, margin: 22 }}>Loading operators...</div>
        : fetchError
          ? <div style={{ color: "#e53935", fontWeight: 600 }}>{fetchError}</div>
          : <table style={{ borderCollapse: "collapse", width: "100%", background: "#fff" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f7fa", borderBottom: "1.5px solid #e0e0e0" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {operators.length === 0
                ? <tr><td colSpan={5} style={{ color: "#999", padding: 28, fontStyle: "italic", textAlign: "center" }}>No operators found.</td></tr>
                : operators.map(op =>
                  <tr key={op.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={tdStyle}>{op.full_name}</td>
                    <td style={tdStyle}>{op.email}</td>
                    <td style={tdStyle}>{op.role}</td>
                    <td style={tdStyle}>{op.is_active ? "Active" : "Disabled"}</td>
                    <td style={tdStyle}>
                      <button
                        style={miniBtn}
                        onClick={() => openEditModal(op)}
                      >Edit</button>
                      <button
                        style={{ ...miniBtn, background: "#e53935", color: "#fff", marginLeft: 7, opacity: deletePending === op.id ? 0.5 : 1 }}
                        disabled={deletePending === op.id}
                        onClick={() => handleDelete(op)}
                      >Delete</button>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
      }

      {/* Modal for Add/Edit Operator */}
      {modalOpen && <OperatorModal
        onClose={() => setModalOpen(false)}
        formState={formState}
        setFormState={setFormState}
        onSubmit={handleFormSubmit}
        pending={formPending}
        isEdit={!!editingOperator}
        error={formError}
        success={formSuccess}
        availableRoles={ROLE_OPTIONS}
      />}
    </section>
  );
}
const thStyle = { padding: "9px 16px", fontWeight: 600, fontSize: 15, color: "#1976d2", borderBottom: "1.5px solid #e0e0e0" };
const tdStyle = { padding: "8px 15px", fontSize: 15, color: "#222", borderBottom: "1px solid #e0e0e0" };
const miniBtn = { background: "#1976d2", color: "#fff", padding: "5px 18px", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" };

/**
 * Modal for add/edit operator form
 */
function OperatorModal({
  onClose, formState, setFormState, onSubmit, pending, isEdit, error, success,
  availableRoles
}) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
      background: "rgba(30,40,80,0.17)", zIndex: 10009, display: "flex", alignItems: "center", justifyContent: "center"
    }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={onSubmit}
        style={{
          background: "#fff", padding: "36px 30px 22px 30px",
          borderRadius: 13, minWidth: 340, maxWidth: "92vw", boxShadow: "0 6px 52px rgba(32,90,200,0.14)", display: "flex", flexDirection: "column", gap: 18
        }}>
        <h3 style={{ color: "#1976d2", marginBottom: 10 }}>{isEdit ? "Edit Operator" : "Add Operator"}</h3>
        <label style={{ fontWeight: 600 }}>
          Name
          <input
            type="text"
            value={formState.full_name}
            maxLength={100}
            required
            onChange={e => setFormState(f => ({ ...f, full_name: e.target.value }))}
            style={inputStyle}
            disabled={pending}
          />
        </label>
        {!isEdit && (
          <label style={{ fontWeight: 600 }}>
            Email
            <input
              type="email"
              value={formState.email}
              maxLength={70}
              required
              onChange={e => setFormState(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
              disabled={pending}
            />
          </label>
        )}
        <label style={{ fontWeight: 600 }}>
          Role
          <select
            value={formState.role}
            onChange={e => setFormState(f => ({ ...f, role: e.target.value }))}
            style={{ ...inputStyle, minWidth: 100 }}
            disabled={pending || isEdit}
            required
          >
            {availableRoles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 600 }}>
          {isEdit ? "New Password (leave blank to keep current)" : "Password"}
          <input
            type="password"
            value={formState.password}
            minLength={isEdit ? 0 : 5}
            required={!isEdit}
            autoComplete="new-password"
            onChange={e => setFormState(f => ({ ...f, password: e.target.value }))}
            style={inputStyle}
            disabled={pending}
            placeholder={isEdit ? "••••••" : "Set password"}
          />
        </label>
        {error && <div style={{ color: "#e53935", fontWeight: 500, fontSize: "1rem" }}>{error}</div>}
        {success && <div style={{ color: "#388e3c", fontWeight: 500, fontSize: "1rem" }}>{success}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              background: "#1976d2",
              color: "#fff", border: "none", fontWeight: 600, borderRadius: 7, padding: "8px 34px", fontSize: 16, cursor: "pointer"
            }}
          >
            {pending ? (isEdit ? "Updating..." : "Adding...") : isEdit ? "Save" : "Add"}
          </button>
          <button
            type="button"
            disabled={pending}
            style={{
              background: "none",
              color: "#333",
              fontWeight: 600,
              border: "1.5px solid #888",
              borderRadius: 7,
              padding: "8px 24px",
              fontSize: 15,
              marginLeft: 12,
              cursor: "pointer"
            }}
            onClick={onClose}
          >Cancel</button>
        </div>
      </form>
    </div>
  );
}
const inputStyle = {
  marginTop: 3, border: "1px solid #bbb", borderRadius: 6, fontSize: 15, padding: "8px 12px", width: "100%", boxSizing: "border-box"
};

export default OperatorsPage;
