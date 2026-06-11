"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../components/LanguageContext";

export default function LoginPage() {
  const { t, locale, setLocale } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("loginError"));
      }

      // Successful login, route to chat
      router.push("/chat");
      router.refresh();
    } catch (err: any) {
      setError(err.message || t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Decorative Orbs */}
      <div style={styles.orb1}></div>
      <div style={styles.orb2}></div>

      {/* Language Toggle Header */}
      <header style={styles.header}>
        <button
          onClick={() => setLocale(locale === "he" ? "en" : "he")}
          className="btn btn-secondary"
          style={styles.langBtn}
        >
          {locale === "he" ? "English" : "עברית"}
        </button>
      </header>

      {/* Centered Glass Login Card */}
      <main style={styles.main}>
        <div className="glass-panel-elevated animate-slide-up" style={styles.card}>
          <div style={styles.logoContainer}>
            <svg
              style={styles.logo}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M12 7v5" />
              <path d="M12 16h.01" />
            </svg>
            <h1 style={styles.title}>{t("appName")}</h1>
            <p style={styles.subtitle}>{t("loginTitle")}</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {error && (
              <div style={styles.errorAlert} className="animate-fade-in">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label htmlFor="email" className="glass-label">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="glass-input"
                autoComplete="email"
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" className="glass-label">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="glass-input"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  {t("loggingIn")}
                </>
              ) : (
                t("signIn")
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#0a0a12",
  },
  orb1: {
    position: "absolute",
    top: "15%",
    left: "15%",
    width: "35vw",
    height: "35vw",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(60px)",
    zIndex: 0,
    animation: "fadeIn 2s ease-in-out",
  },
  orb2: {
    position: "absolute",
    bottom: "10%",
    right: "15%",
    width: "40vw",
    height: "40vw",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(80px)",
    zIndex: 0,
    animation: "fadeIn 3s ease-in-out",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "20px 40px",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 10,
  },
  langBtn: {
    padding: "8px 16px",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 5,
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px 30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "32px",
    textAlign: "center",
  },
  logo: {
    width: "48px",
    height: "48px",
    color: "#818cf8",
    marginBottom: "16px",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#f1f5f9",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    gap: "10px",
  },
  errorAlert: {
    background: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    color: "#f87171",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "0.88rem",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
};
