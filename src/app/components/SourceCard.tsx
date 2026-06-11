"use client";

import React, { useState } from "react";
import { useLanguage } from "./LanguageContext";

export interface Source {
  id: string;
  category: string;
  subcategory?: string;
  serviceName: string;
  description?: string;
  targetAudience?: string;
  costInfo?: string;
  location?: string;
  contactInfo?: string;
  contentText: string;
  sourceSheet: string;
  datasetVersion: string;
  score?: number;
}

interface SourceCardProps {
  source: Source;
}

export default function SourceCard({ source }: SourceCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.card} className="glass-panel">
      <div style={styles.header}>
        <div style={styles.titleArea}>
          <span style={styles.categoryBadge}>
            {source.category}
            {source.subcategory ? ` > ${source.subcategory}` : ""}
          </span>
          <h4 style={styles.serviceName}>{source.serviceName}</h4>
        </div>
        {source.score !== undefined && (
          <div style={styles.scoreBadge}>
            {Math.round(source.score * 100)}%
          </div>
        )}
      </div>

      <p style={styles.description}>
        {expanded 
          ? source.description || source.contentText 
          : `${(source.description || source.contentText || "").substring(0, 120)}...`}
      </p>

      {expanded && (
        <div style={styles.details} className="animate-fade-in">
          {source.targetAudience && (
            <div style={styles.detailRow}>
              <strong style={styles.label}>{t("targetAudience")}:</strong>
              <span>{source.targetAudience}</span>
            </div>
          )}
          {source.costInfo && (
            <div style={styles.detailRow}>
              <strong style={styles.label}>{t("costInfo")}:</strong>
              <span>{source.costInfo}</span>
            </div>
          )}
          {source.location && (
            <div style={styles.detailRow}>
              <strong style={styles.label}>{t("location")}:</strong>
              <span>{source.location}</span>
            </div>
          )}
          {source.contactInfo && (
            <div style={styles.detailRow}>
              <strong style={styles.label}>{t("contactInfo")}:</strong>
              <span style={styles.contactValue}>{source.contactInfo}</span>
            </div>
          )}
          <div style={styles.divider}></div>
          <div style={styles.metaRow}>
            <span>{t("sourceSheetName")}: {source.sourceSheet}</span>
            <span>{t("datasetVersion")}: {source.datasetVersion}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.expandBtn}
      >
        {expanded ? t("showLess") : t("readMore")}
        <svg
          style={{
            ...styles.arrowIcon,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    borderRadius: "12px",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  titleArea: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  categoryBadge: {
    fontSize: "0.725rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#a78bfa",
  },
  serviceName: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#f1f5f9",
  },
  scoreBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    background: "rgba(52, 211, 153, 0.15)",
    color: "#34d399",
    padding: "4px 8px",
    borderRadius: "12px",
    whiteSpace: "nowrap",
  },
  description: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    lineHeight: "1.5",
  },
  expandBtn: {
    background: "none",
    border: "none",
    color: "#818cf8",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 0",
    width: "fit-content",
    alignSelf: "flex-start",
    transition: "color 0.2s",
  },
  arrowIcon: {
    transition: "transform 0.2s ease",
  },
  details: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "rgba(0, 0, 0, 0.2)",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "6px",
    border: "1px solid rgba(255, 255, 255, 0.03)",
  },
  detailRow: {
    display: "flex",
    fontSize: "0.85rem",
    gap: "8px",
    lineHeight: "1.4",
  },
  label: {
    color: "#64748b",
    fontWeight: 500,
    minWidth: "100px",
  },
  contactValue: {
    color: "#34d399",
  },
  divider: {
    height: "1px",
    background: "rgba(255, 255, 255, 0.05)",
    margin: "6px 0",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    color: "#64748b",
  },
};
