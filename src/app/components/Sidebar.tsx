"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageContext";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  user: { email: string; role: string } | null;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  user,
}: SidebarProps) {
  const { t, locale, setLocale, dir } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside style={styles.sidebar} className="glass-panel">
      {/* Header / Logo */}
      <div style={styles.header}>
        <div style={styles.logoGroup}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ color: "#818cf8" }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={styles.appName}>{t("appName")}</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div style={styles.actionArea}>
        <button onClick={onCreateSession} className="btn btn-primary" style={styles.newChatBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("newChat")}
        </button>
      </div>

      {/* Search Input */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder={t("searchChats")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input"
          style={styles.searchInput}
        />
        <svg
          style={{
            ...styles.searchIcon,
            left: dir === "ltr" ? "12px" : "auto",
            right: dir === "rtl" ? "12px" : "auto",
          }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Chat Session List */}
      <div style={styles.sessionList}>
        <div style={styles.listLabel}>{t("activeChats")}</div>
        
        {filteredSessions.length === 0 ? (
          <div style={styles.emptyState}>{t("noChats")}</div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === currentSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                style={{
                  ...styles.sessionItem,
                  background: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
                  borderColor: isActive ? "rgba(99, 102, 241, 0.3)" : "transparent",
                }}
                className="session-hover-effect"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: isActive ? "#818cf8" : "var(--text-secondary)" }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                
                <span style={{
                  ...styles.sessionTitle,
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {session.title}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  style={styles.deleteBtn}
                  title={t("delete")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--error)" }}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Profile & Actions */}
      <div style={styles.footer} className="glass-panel">
        {user && (
          <div style={styles.profileArea}>
            <div style={styles.userAvatar}>
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div style={styles.profileText}>
              <div style={styles.userEmail}>{user.email}</div>
              <div style={styles.userRole}>
                {user.role === "admin" ? t("adminRole") : t("userRole")}
              </div>
            </div>
          </div>
        )}

        <div style={styles.controlsRow}>
          {/* Locale Toggle */}
          <button
            onClick={() => setLocale(locale === "he" ? "en" : "he")}
            className="btn btn-secondary"
            style={styles.controlBtn}
          >
            {locale === "he" ? "EN" : "עב"}
          </button>

          {/* Admin Panel Link */}
          {user?.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="btn btn-secondary"
              style={styles.controlBtn}
              title={t("adminPanel")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ ...styles.controlBtn, color: "var(--error)" }}
            title={t("logout")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "320px",
    height: "100%",
    borderInlineEnd: "1px solid var(--glass-border)",
    display: "flex",
    flexDirection: "column",
    borderRadius: 0,
    background: "rgba(10, 10, 18, 0.4)",
    flexShrink: 0,
  },
  header: {
    padding: "24px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  appName: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.01em",
  },
  actionArea: {
    padding: "16px 20px",
  },
  newChatBtn: {
    width: "100%",
    padding: "12px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  searchContainer: {
    position: "relative",
    padding: "0 20px 16px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
  },
  searchInput: {
    paddingInlineStart: "38px",
    fontSize: "0.85rem",
    height: "36px",
  },
  searchIcon: {
    position: "absolute",
    top: "10px",
    color: "var(--text-muted)",
  },
  sessionList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  listLabel: {
    fontSize: "0.725rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "var(--text-muted)",
    padding: "0 8px 8px 8px",
    letterSpacing: "0.05em",
  },
  emptyState: {
    textAlign: "center",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    padding: "24px 0",
  },
  sessionItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    border: "1px solid transparent",
    position: "relative",
  },
  sessionTitle: {
    fontSize: "0.875rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s, background-color 0.2s",
  },
  footer: {
    padding: "16px",
    borderRadius: 0,
    border: "none",
    borderTop: "1px solid var(--glass-border)",
    background: "rgba(10, 10, 18, 0.8)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
  },
  profileText: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  userEmail: {
    fontSize: "0.85rem",
    color: "#f1f5f9",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: "0.75rem",
    color: "#818cf8",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  controlsRow: {
    display: "flex",
    gap: "8px",
  },
  controlBtn: {
    flex: 1,
    height: "36px",
    padding: 0,
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.03)",
  },
};
