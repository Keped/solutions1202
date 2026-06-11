"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatMessage, { Message } from "../components/ChatMessage";
import { useLanguage } from "../components/LanguageContext";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

export default function ChatPage() {
  const { t, dir } = useLanguage();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user and session list on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch User Info
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user || userData);
        }

        // Fetch Chat Sessions
        await fetchSessions();
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchInitialData();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    fetchMessages(sessionId);
  };

  const handleCreateSession = async () => {
    try {
      const title = `${t("newChat")} ${new Date().toLocaleDateString()}`;
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const responseData = await res.json();
        const newSession = responseData.session || responseData;
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setMessages([]); // Start fresh
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    setInput("");
    setSending(true);

    let activeSessionId = currentSessionId;

    // Create session on-the-fly if none selected
    if (!activeSessionId) {
      try {
        const title = userText.substring(0, 30) || t("newChat");
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          const responseData = await res.json();
          const newSession = responseData.session || responseData;
          setSessions((prev) => [newSession, ...prev]);
          activeSessionId = newSession.id;
          setCurrentSessionId(newSession.id);
        } else {
          setSending(false);
          return;
        }
      } catch (err) {
        console.error("On-the-fly session creation failed:", err);
        setSending(false);
        return;
      }
    }

    // Add user message to UI immediately
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, message: userText }),
      });

      if (response.ok) {
        const responseData = await response.json();
        // Assume API returns { message: assistantMessage }
        const assistantMsg: Message = responseData.message || responseData;
        setMessages((prev) => [...prev, assistantMsg]);
        
        // Refresh session list to update title if it was generated/updated
        fetchSessions();
      } else {
        throw new Error("Message failed to send");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Show error in message stream
      const errMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: "Error: Failed to fetch assistant response.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div style={styles.appContainer} dir={dir}>
      {/* Sidebar component */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onDeleteSession={handleDeleteSession}
        user={user}
      />

      {/* Main Workspace */}
      <main style={styles.workspace}>
        {/* Top Navbar */}
        <header style={styles.topBar} className="glass-panel">
          <div style={styles.topBarTitle}>
            {currentSessionId 
              ? sessions.find(s => s.id === currentSessionId)?.title 
              : t("appName")
            }
          </div>
        </header>

        {/* Message Stream */}
        <div style={styles.messageStream}>
          {loadingMessages ? (
            <div style={styles.loaderArea}>
              <div className="animate-fade-in" style={styles.loadingPulse}></div>
              <div className="animate-fade-in" style={{ ...styles.loadingPulse, width: "70%" }}></div>
              <div className="animate-fade-in" style={{ ...styles.loadingPulse, width: "85%" }}></div>
            </div>
          ) : messages.length === 0 ? (
            <div style={styles.welcomeContainer} className="animate-fade-in">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: "#a78bfa", marginBottom: "20px" }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M9 10h.01" />
                <path d="M15 10h.01" />
                <path d="M12 14c1.66 0 3-1.34 3-3" />
              </svg>
              <h2 style={styles.welcomeTitle}>
                {user?.email ? `${t("appName")} - ${user.email.split("@")[0]}` : t("appName")}
              </h2>
              <p style={styles.welcomeSubtitle}>
                {dir === "rtl" 
                  ? "כיצד אוכל לסייע לך היום? שאל אותי לגבי פתרונות, שירותים, קהל יעד או עלויות."
                  : "How can I assist you today? Ask me about solutions, services, targets, or costs."
                }
              </p>

              {/* Sample prompts */}
              <div style={styles.samplePrompts}>
                <button 
                  onClick={() => setInput(dir === "rtl" ? "האם יש פתרון דיור מתאים למבוגרים?" : "Is there a housing solution for older adults?")}
                  style={styles.sampleCard}
                  className="glass-panel"
                >
                  {dir === "rtl" ? "פתרונות דיור למבוגרים" : "Housing solutions for older adults"}
                </button>
                <button 
                  onClick={() => setInput(dir === "rtl" ? "מהם השירותים הזמינים ללא עלות?" : "What free services are available?")}
                  style={styles.sampleCard}
                  className="glass-panel"
                >
                  {dir === "rtl" ? "שירותים ללא עלות כספית" : "Free solutions & services"}
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {sending && (
                <div style={styles.thinkingMsg} className="animate-fade-in">
                  <div style={styles.thinkingAvatar}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                      <circle cx="12" cy="5" r="2" />
                      <path d="M12 7v4" />
                    </svg>
                  </div>
                  <div style={styles.thinkingBubble} className="glass-panel">
                    <span style={styles.spinner}></span>
                    <span>{t("thinking")}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={styles.inputArea} className="glass-panel">
          <form onSubmit={handleSendMessage} style={styles.inputForm}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("typeMessage")}
              rows={1}
              style={styles.textarea}
              className="glass-input"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn btn-primary btn-icon"
              style={{
                ...styles.sendBtn,
                transform: dir === "rtl" ? "scaleX(-1)" : "none",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    background: "#0a0a12",
  },
  workspace: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    position: "relative",
    background: "radial-gradient(circle at 50% 50%, #121225 0%, #0a0a12 100%)",
  },
  topBar: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    borderBottom: "1px solid var(--glass-border)",
    borderLeft: "none",
    borderRight: "none",
    borderRadius: 0,
    background: "rgba(10, 10, 18, 0.6)",
    zIndex: 10,
  },
  topBarTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  messageStream: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
  },
  messagesList: {
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  loaderArea: {
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px",
  },
  loadingPulse: {
    height: "40px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.02)",
    width: "100%",
    animation: "pulse 1.5s infinite ease-in-out",
  },
  welcomeContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: "40px 20px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  welcomeTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "12px",
    letterSpacing: "-0.02em",
  },
  welcomeSubtitle: {
    fontSize: "1rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  samplePrompts: {
    display: "flex",
    gap: "16px",
    width: "100%",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  sampleCard: {
    flex: "1 1 200px",
    maxWidth: "280px",
    padding: "16px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid var(--glass-border)",
    color: "var(--text-secondary)",
    fontSize: "0.9rem",
    fontWeight: 500,
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
  },
  thinkingMsg: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    alignItems: "center",
  },
  thinkingAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  },
  thinkingBubble: {
    padding: "12px 18px",
    borderRadius: "18px",
    border: "1px solid var(--glass-border)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#a78bfa",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  inputArea: {
    padding: "16px 24px",
    margin: "12px 24px 24px 24px",
    maxWidth: "800px",
    width: "calc(100% - 48px)",
    alignSelf: "center",
    borderRadius: "16px",
    background: "rgba(10, 10, 18, 0.85)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
  },
  inputForm: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  textarea: {
    flex: 1,
    resize: "none",
    height: "44px",
    display: "flex",
    alignItems: "center",
    paddingTop: "12px",
    paddingBottom: "12px",
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
  },
  sendBtn: {
    flexShrink: 0,
  },
};
