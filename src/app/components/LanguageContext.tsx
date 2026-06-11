"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Locale = "he" | "en";
type Direction = "rtl" | "ltr";

interface LanguageContextType {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations["en"]) => string;
}

const translations = {
  he: {
    appName: "צ'אט פתרונות",
    loginTitle: "כניסה למערכת",
    email: "כתובת אימייל",
    password: "סיסמה",
    signIn: "התחבר",
    emailPlaceholder: "הזן אימייל...",
    passwordPlaceholder: "הזן סיסמה...",
    loggingIn: "מתחבר...",
    loginError: "פרטי התחברות שגויים, אנא נסה שוב",
    logout: "התנתק",
    newChat: "שיחה חדשה",
    searchChats: "חפש שיחות...",
    typeMessage: "הקלד הודעה כאן...",
    send: "שלח",
    thinking: "חושב...",
    sources: "מקורות מידע",
    noSources: "אין מקורות זמינים להודעה זו",
    category: "קטגוריה",
    subcategory: "תת-קטגוריה",
    serviceName: "שם השירות",
    targetAudience: "קהל יעד",
    costInfo: "עלות / מידע כספי",
    location: "מיקום",
    contactInfo: "פרטי קשר",
    description: "תיאור",
    adminPanel: "פאנל ניהול",
    backToChat: "חזור לצ'אט",
    userManagement: "ניהול משתמשים",
    role: "תפקיד",
    actions: "פעולות",
    delete: "מחק",
    addUser: "הוסף משתמש",
    selectRole: "בחר תפקיד",
    databaseSyncStatus: "סטטוס סנכרון בסיס נתונים",
    uploadExcel: "העלה קובץ Excel / סנכרן",
    syncSuccess: "הסנכרון הושלם בהצלחה",
    syncError: "שגיאה במהלך הסנכרון",
    lastSynced: "סנכרון אחרון",
    neverSynced: "טרם סונכרן",
    noChats: "אין שיחות קודמות",
    activeChats: "שיחות פעילות",
    userRole: "משתמש",
    adminRole: "מנהל",
    createUserTitle: "יצירת משתמש חדש",
    confirmDeleteUser: "האם אתה בטוח שברצונך למחוק משתמש זה?",
    datasetVersion: "גרסת סט נתונים",
    sourceSheetName: "גיליון מקור",
    processingExcel: "מעבד קובץ ומסנכרן וקטורים...",
    noUsersFound: "לא נמצאו משתמשים",
    close: "סגור",
    readMore: "קרא עוד",
    showLess: "הצג פחות"
  },
  en: {
    appName: "Solutions Chat",
    loginTitle: "Sign In",
    email: "Email Address",
    password: "Password",
    signIn: "Sign In",
    emailPlaceholder: "Enter email...",
    passwordPlaceholder: "Enter password...",
    loggingIn: "Signing in...",
    loginError: "Invalid credentials, please try again",
    logout: "Logout",
    newChat: "New Chat",
    searchChats: "Search chats...",
    typeMessage: "Type a message here...",
    send: "Send",
    thinking: "Thinking...",
    sources: "Sources & References",
    noSources: "No sources available for this message",
    category: "Category",
    subcategory: "Subcategory",
    serviceName: "Service Name",
    targetAudience: "Target Audience",
    costInfo: "Cost / Pricing",
    location: "Location",
    contactInfo: "Contact Info",
    description: "Description",
    adminPanel: "Admin Panel",
    backToChat: "Back to Chat",
    userManagement: "User Management",
    role: "Role",
    actions: "Actions",
    delete: "Delete",
    addUser: "Add User",
    selectRole: "Select Role",
    databaseSyncStatus: "Database Sync Status",
    uploadExcel: "Upload Excel / Sync",
    syncSuccess: "Database synced successfully",
    syncError: "Error during database sync",
    lastSynced: "Last Synced",
    neverSynced: "Never synced",
    noChats: "No chat history",
    activeChats: "Active Conversations",
    userRole: "User",
    adminRole: "Admin",
    createUserTitle: "Create New User",
    confirmDeleteUser: "Are you sure you want to delete this user?",
    datasetVersion: "Dataset Version",
    sourceSheetName: "Source Sheet",
    processingExcel: "Processing excel and syncing embeddings...",
    noUsersFound: "No users found",
    close: "Close",
    readMore: "Read more",
    showLess: "Show less"
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");

  useEffect(() => {
    // Read from localStorage if set
    const savedLocale = localStorage.getItem("preferred-locale") as Locale;
    if (savedLocale === "en" || savedLocale === "he") {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred-locale", newLocale);
  };

  const dir: Direction = locale === "he" ? "rtl" : "ltr";

  // Side effect: update html direction
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  const t = (key: keyof typeof translations["en"]) => {
    return translations[locale][key] || translations["he"][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
