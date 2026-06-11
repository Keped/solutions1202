"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../components/LanguageContext";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface SyncStatus {
  lastSynced: string | null;
  datasetVersion: string | null;
  solutionsCount: number;
  faqsCount: number;
}

export default function AdminPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  // User Management States
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [showAddForm, setShowAddForm] = useState(false);
  const [userActionError, setUserActionError] = useState("");
  const [userActionSuccess, setUserActionSuccess] = useState("");

  // Sync / Upload States
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncSuccess, setSyncSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authorization Check State
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const user = await res.json();
          if (user.role === "admin") {
            setIsAdmin(true);
            fetchUsers();
            fetchSyncStatus();
          } else {
            router.push("/chat");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    verifyAdmin();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch("/api/admin/sync");
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (err) {
      console.error("Failed to load sync status:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError("");
    setUserActionSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [...prev, newUser]);
        setUserActionSuccess(t("syncSuccess"));
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserRole("user");
        setShowAddForm(false);
      } else {
        const errorData = await res.json();
        setUserActionError(errorData.error || t("syncError"));
      }
    } catch (err) {
      setUserActionError(t("syncError"));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("confirmDeleteUser"))) return;
    setUserActionError("");
    setUserActionSuccess("");

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setUserActionSuccess(t("syncSuccess"));
      } else {
        const errorData = await res.json();
        setUserActionError(errorData.error || t("syncError"));
      }
    } catch (err) {
      setUserActionError(t("syncError"));
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSyncing(true);
    setSyncError("");
    setSyncSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSyncSuccess(t("syncSuccess"));
        fetchSyncStatus();
      } else {
        const errorData = await res.json();
        setSyncError(errorData.error || t("syncError"));
      }
    } catch (err: any) {
      setSyncError(err.message || t("syncError"));
    } finally {
      setSyncing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (checkingAuth) {
    return (
      <div style={styles.loadingContainer}>
        <span style={styles.spinner}></span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={styles.container} dir={dir}>
      {/* Top navbar */}
      <header style={styles.navbar} className="glass-panel">
        <h1 style={styles.title}>{t("adminPanel")}</h1>
        <button onClick={() => router.push("/chat")} className="btn btn-secondary">
          <svg
            style={{ transform: dir === "rtl" ? "scaleX(-1)" : "none" }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t("backToChat")}
        </button>
      </header>

      {/* Main dashboard columns */}
      <main style={styles.dashboard}>
        {/* User Management Section */}
        <section style={styles.section} className="glass-panel">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>{t("userManagement")}</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
              style={styles.addBtn}
            >
              {showAddForm ? t("close") : t("addUser")}
            </button>
          </div>

          {userActionError && <div style={styles.errorAlert}>{userActionError}</div>}
          {userActionSuccess && <div style={styles.successAlert}>{userActionSuccess}</div>}

          {showAddForm && (
            <form onSubmit={handleCreateUser} style={styles.form} className="glass-panel-elevated animate-slide-up">
              <h3 style={styles.formTitle}>{t("createUserTitle")}</h3>
              
              <div style={styles.inputGroup}>
                <label className="glass-label">{t("email")}</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="glass-input"
                  placeholder="name@domain.com"
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="glass-label">{t("password")}</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="glass-input"
                  placeholder="••••••••"
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="glass-label">{t("role")}</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="glass-input"
                  style={styles.select}
                >
                  <option value="user">{t("userRole")}</option>
                  <option value="admin">{t("adminRole")}</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                {t("addUser")}
              </button>
            </form>
          )}

          {/* User List Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t("email")}</th>
                  <th style={styles.th}>{t("role")}</th>
                  <th style={styles.th}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={styles.tdEmpty}>
                      {t("noUsersFound")}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            background: u.role === "admin" ? "rgba(167, 139, 250, 0.15)" : "rgba(255, 255, 255, 0.05)",
                            color: u.role === "admin" ? "#a78bfa" : "var(--text-secondary)",
                          }}
                        >
                          {u.role === "admin" ? t("adminRole") : t("userRole")}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn btn-danger"
                          style={styles.deleteUserBtn}
                        >
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Database Upload & Status Section */}
        <section style={styles.section} className="glass-panel">
          <h2 style={styles.sectionTitle}>{t("databaseSyncStatus")}</h2>

          {syncError && <div style={styles.errorAlert}>{syncError}</div>}
          {syncSuccess && <div style={styles.successAlert}>{syncSuccess}</div>}

          {/* Sync Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard} className="glass-panel">
              <div style={styles.statLabel}>Solutions (Vectors)</div>
              <div style={styles.statVal}>{syncStatus?.solutionsCount ?? 0}</div>
            </div>
            <div style={styles.statCard} className="glass-panel">
              <div style={styles.statLabel}>FAQs (Vectors)</div>
              <div style={styles.statVal}>{syncStatus?.faqsCount ?? 0}</div>
            </div>
          </div>

          <div style={styles.syncDetails} className="glass-panel">
            <div style={styles.detailRow}>
              <span>{t("lastSynced")}:</span>
              <strong>
                {syncStatus?.lastSynced 
                  ? new Date(syncStatus.lastSynced).toLocaleString() 
                  : t("neverSynced")
                }
              </strong>
            </div>
            <div style={styles.detailRow}>
              <span>{t("datasetVersion")}:</span>
              <strong>{syncStatus?.datasetVersion || "—"}</strong>
            </div>
          </div>

          {/* Excel Uploader Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...styles.uploadDropzone,
              borderColor: syncing ? "var(--accent)" : "var(--glass-border)",
            }}
            className="glass-panel"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              disabled={syncing}
            />

            {syncing ? (
              <div style={styles.uploadingArea}>
                <span style={styles.spinner}></span>
                <p style={styles.uploadText}>{t("processingExcel")}</p>
              </div>
            ) : (
              <div style={styles.uploadingArea}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--accent-light)", marginBottom: "12px" }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={styles.uploadText}>{t("uploadExcel")}</p>
                <span style={styles.uploadHint}>Supports .xlsx files containing FAQ & Solutions sheets</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    width: "100vw",
    background: "#0a0a12",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    gap: "24px",
    overflowY: "auto",
  },
  loadingContainer: {
    height: "100vh",
    width: "100vw",
    background: "#0a0a12",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  navbar: {
    height: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    background: "rgba(10, 10, 18, 0.6)",
    borderRadius: "16px",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.01em",
  },
  dashboard: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "24px",
    flex: 1,
  },
  section: {
    padding: "24px",
    background: "rgba(18, 18, 31, 0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    borderRadius: "16px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  addBtn: {
    padding: "8px 16px",
    fontSize: "0.85rem",
  },
  form: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    background: "rgba(10,10,18,0.6)",
    borderRadius: "12px",
  },
  formTitle: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  select: {
    cursor: "pointer",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "start",
  },
  th: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--glass-border)",
    color: "var(--text-muted)",
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.02)",
  },
  td: {
    padding: "16px",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
  },
  tdEmpty: {
    padding: "32px",
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  },
  roleBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: "12px",
  },
  deleteUserBtn: {
    padding: "6px 12px",
    fontSize: "0.8rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  statCard: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.2)",
    gap: "8px",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  statVal: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  syncDetails: {
    padding: "16px",
    background: "rgba(0, 0, 0, 0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
  },
  uploadDropzone: {
    border: "2px dashed var(--glass-border)",
    padding: "32px 20px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "rgba(0, 0, 0, 0.15)",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  uploadingArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "#f1f5f9",
    marginTop: "8px",
  },
  uploadHint: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "4px",
    textAlign: "center",
  },
  errorAlert: {
    background: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    color: "#f87171",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "0.88rem",
  },
  successAlert: {
    background: "rgba(52, 211, 153, 0.1)",
    border: "1px solid rgba(52, 211, 153, 0.2)",
    color: "#34d399",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "0.88rem",
  },
};
