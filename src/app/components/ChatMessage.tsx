"use client";

import React, { useState } from "react";
import { useLanguage } from "./LanguageContext";
import SourceCard, { Source } from "./SourceCard";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[] | null;
  createdAt: string | Date;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { t, dir } = useLanguage();
  const [showSources, setShowSources] = useState(false);

  const isUser = message.role === "user";
  const hasSources = !isUser && message.sources && message.sources.length > 0;

  // Simple formatter to convert markdown-like structure or newlines to HTML
  const formatContent = (text: string) => {
    return text.split("\n").map((line, index) => {
      // Bold syntax helper: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={styles.boldText}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <React.Fragment key={index}>
          {parts.length > 0 ? parts : line}
          {index < text.split("\n").length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      style={{
        ...styles.messageContainer,
        flexDirection: isUser ? "row-reverse" : "row",
      }}
      className="animate-fade-in"
    >
      {/* Avatar */}
      <div
        style={{
          ...styles.avatar,
          background: isUser ? "linear-gradient(135deg, #6366f1, #818cf8)" : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
        }}
      >
        {isUser ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8.01" y2="16" />
            <line x1="16" y1="16" x2="16.01" y2="16" />
          </svg>
        )}
      </div>

      {/* Content wrapper */}
      <div style={styles.contentWrapper}>
        {/* Bubble */}
        <div
          style={{
            ...styles.bubble,
            background: isUser ? "rgba(99, 102, 241, 0.15)" : "var(--glass-bg)",
            borderColor: isUser ? "rgba(99, 102, 241, 0.3)" : "var(--glass-border)",
            borderBottomRightRadius: isUser && dir === "rtl" ? "4px" : "18px",
            borderBottomLeftRadius: isUser && dir === "ltr" ? "4px" : "18px",
            borderTopLeftRadius: !isUser && dir === "ltr" ? "4px" : "18px",
            borderTopRightRadius: !isUser && dir === "rtl" ? "4px" : "18px",
          }}
        >
          <div style={styles.text}>{formatContent(message.content)}</div>
        </div>

        {/* Timestamp */}
        <span
          style={{
            ...styles.timestamp,
            alignSelf: isUser ? "flex-end" : "flex-start",
          }}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {/* Sources Accordion */}
        {hasSources && (
          <div style={styles.sourcesContainer}>
            <button
              onClick={() => setShowSources(!showSources)}
              style={styles.sourcesToggle}
              className="glass-panel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#a78bfa" }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>
                {t("sources")} ({message.sources!.length})
              </span>
              <svg
                style={{
                  ...styles.chevron,
                  transform: showSources ? "rotate(180deg)" : "rotate(0deg)",
                  marginInlineStart: "auto",
                }}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showSources && (
              <div style={styles.sourcesList} className="animate-slide-up">
                {message.sources!.map((source, index) => (
                  <SourceCard key={source.id || index} source={source} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  messageContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    width: "100%",
    alignItems: "flex-start",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    flexShrink: 0,
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "80%",
    minWidth: "120px",
  },
  bubble: {
    padding: "14px 18px",
    borderRadius: "18px",
    border: "1px solid",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    backdropFilter: "var(--glass-blur)",
    WebkitBackdropFilter: "var(--glass-blur)",
    wordBreak: "break-word",
  },
  text: {
    fontSize: "0.95rem",
    lineHeight: "1.6",
    color: "var(--text-primary)",
  },
  boldText: {
    color: "#ffffff",
    fontWeight: 600,
  },
  timestamp: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    padding: "0 4px",
  },
  sourcesContainer: {
    marginTop: "8px",
    width: "100%",
  },
  sourcesToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--glass-border)",
    background: "rgba(255, 255, 255, 0.02)",
    color: "var(--text-secondary)",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    textAlign: "start",
    transition: "all 0.2s",
  },
  chevron: {
    transition: "transform 0.2s ease",
  },
  sourcesList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
    paddingInlineStart: "4px",
  },
};
