import "dotenv/config";
import * as xlsx from "xlsx";
import * as crypto from "crypto";
import { db } from "./index";
import { solutions, faqEntries, users } from "./schema";
import { GeminiProvider } from "../lib/providers/gemini";
import { hashPassword } from "../lib/auth";

// Ensure API key and Database URL are present
const geminiApiKey = process.env.GEMINI_API_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!geminiApiKey) {
  console.error("ERROR: GEMINI_API_KEY environment variable is required for seeding embeddings.");
  process.exit(1);
}

if (!dbUrl) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const gemini = new GeminiProvider();

const isIndexOrContact = (name: string) => {
  const normalized = name.toLowerCase().trim();
  return (
    normalized.includes("index") ||
    normalized.includes("אינדקס") ||
    normalized.includes("contact") ||
    normalized.includes("יומן") ||
    normalized.includes("קשר") ||
    normalized.includes("log")
  );
};

const isFaqSheet = (name: string) => {
  const normalized = name.toLowerCase().trim();
  return (
    normalized.includes("faq") ||
    normalized.includes("שאלות") ||
    normalized.includes("תשובות")
  );
};

async function seed() {
  console.log("Starting database seeding...");

  // 1. Create a default admin user and normal user for testing
  try {
    const adminEmail = "admin@solutions.com";
    const userEmail = "user@solutions.com";
    
    const adminPasswordHash = await hashPassword("admin123");
    const userPasswordHash = await hashPassword("user123");

    await db.insert(users).values([
      {
        id: crypto.randomUUID(),
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "admin",
      },
      {
        id: crypto.randomUUID(),
        email: userEmail,
        passwordHash: userPasswordHash,
        role: "user",
      }
    ]).onConflictDoNothing();
    
    console.log("Successfully seeded default users (admin@solutions.com / user@solutions.com).");
  } catch (err) {
    console.error("Error seeding default users:", err);
  }

  // 2. Read the XLSX file
  const filePath = "/Users/zivtaller/.gemini/antigravity/scratch/seed_data.xlsx";
  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (error: any) {
    console.error(`Error reading Excel file at ${filePath}:`, error.message);
    process.exit(1);
  }

  const datasetVersion = "1.0.0-" + new Date().toISOString().split("T")[0];

  for (const sheetName of workbook.SheetNames) {
    if (isIndexOrContact(sheetName)) {
      console.log(`Skipping index/log sheet: ${sheetName}`);
      continue;
    }

    console.log(`Processing sheet: ${sheetName}...`);
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to 2D array
    const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    if (rows.length === 0) {
      console.log(`Sheet ${sheetName} is empty. Skipping.`);
      continue;
    }

    // Find header row (the first row with at least 2 non-empty values)
    let headerRowIndex = 0;
    for (let i = 0; i < rows.length; i++) {
      const nonNullCount = rows[i].filter((cell) => cell !== null && cell !== undefined && cell !== "").length;
      if (nonNullCount >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rows[headerRowIndex].map((h) => String(h || "").trim());
    console.log(`Headers found for sheet ${sheetName}:`, headers);

    const dataRows = rows.slice(headerRowIndex + 1);

    if (isFaqSheet(sheetName)) {
      // Process as FAQ sheet
      let qIdx = -1, aIdx = -1, tIdx = -1;

      headers.forEach((h, idx) => {
        const lower = h.toLowerCase();
        if (lower.includes("שאלה") || lower.includes("question")) qIdx = idx;
        else if (lower.includes("תשובה") || lower.includes("answer")) aIdx = idx;
        else if (lower.includes("נושא") || lower.includes("topic") || lower.includes("קטגוריה")) tIdx = idx;
      });

      // Fallback indices if not matched
      if (qIdx === -1) qIdx = 0;
      if (aIdx === -1) aIdx = 1;

      console.log(`FAQ Index mapping - Question: ${qIdx}, Answer: ${aIdx}, Topic: ${tIdx}`);

      for (const row of dataRows) {
        const question = row[qIdx] ? String(row[qIdx]).trim() : "";
        const suggestedAnswer = row[aIdx] ? String(row[aIdx]).trim() : "";
        const topic = tIdx !== -1 && row[tIdx] ? String(row[tIdx]).trim() : sheetName;

        if (!question || !suggestedAnswer) continue;

        const combinedText = `שאלה: ${question}\nתשובה: ${suggestedAnswer}`;
        console.log(`Seeding FAQ: "${question.substring(0, 40)}..."`);

        try {
          const embedding = await gemini.getEmbedding(combinedText);
          await db.insert(faqEntries).values({
            id: crypto.randomUUID(),
            topic,
            question,
            suggestedAnswer,
            embedding,
          });
        } catch (error: any) {
          console.error(`Error embedding/seeding FAQ "${question.substring(0, 30)}":`, error.message);
        }
      }
    } else {
      // Process as solutions sheet
      let nameIdx = -1, descIdx = -1, audIdx = -1, costIdx = -1, locIdx = -1, contactIdx = -1, subcatIdx = -1;

      headers.forEach((h, idx) => {
        const lower = h.toLowerCase();
        if (lower.includes("שם השירות") || lower.includes("שם") || lower.includes("שירות") || lower.includes("service name") || lower.includes("מענה")) {
          if (nameIdx === -1) nameIdx = idx;
        } else if (lower.includes("תיאור") || lower.includes("פירוט") || lower.includes("description")) {
          if (descIdx === -1) descIdx = idx;
        } else if (lower.includes("קהל יעד") || lower.includes("אוכלוסייה") || lower.includes("target")) {
          if (audIdx === -1) audIdx = idx;
        } else if (lower.includes("עלות") || lower.includes("מחיר") || lower.includes("cost") || lower.includes("תשלום")) {
          if (costIdx === -1) costIdx = idx;
        } else if (lower.includes("מיקום") || lower.includes("כתובת") || lower.includes("אזור") || lower.includes("location")) {
          if (locIdx === -1) locIdx = idx;
        } else if (lower.includes("קשר") || lower.includes("טלפון") || lower.includes("אתר") || lower.includes("לינק") || lower.includes("contact")) {
          if (contactIdx === -1) contactIdx = idx;
        } else if (lower.includes("תת") || lower.includes("תת קטגוריה") || lower.includes("subcategory")) {
          if (subcatIdx === -1) subcatIdx = idx;
        }
      });

      // Fallback
      if (nameIdx === -1) nameIdx = 0;
      if (descIdx === -1) descIdx = 1;

      console.log(`Solutions Index mapping - Name: ${nameIdx}, Desc: ${descIdx}, Contact: ${contactIdx}, Location: ${locIdx}`);

      for (const row of dataRows) {
        const serviceName = row[nameIdx] ? String(row[nameIdx]).trim() : "";
        if (!serviceName) continue;

        const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : "";
        const subcategory = subcatIdx !== -1 && row[subcatIdx] ? String(row[subcatIdx]).trim() : "";
        const targetAudience = audIdx !== -1 && row[audIdx] ? String(row[audIdx]).trim() : "";
        const costInfo = costIdx !== -1 && row[costIdx] ? String(row[costIdx]).trim() : "";
        const location = locIdx !== -1 && row[locIdx] ? String(row[locIdx]).trim() : "";
        const contactInfo = contactIdx !== -1 && row[contactIdx] ? String(row[contactIdx]).trim() : "";

        // Concatenate non-empty fields for text representation
        const parts = [
          `שם השירות: ${serviceName}`,
          `קטגוריה: ${sheetName}`,
        ];
        if (subcategory) parts.push(`תת קטגוריה: ${subcategory}`);
        if (description) parts.push(`תיאור: ${description}`);
        if (targetAudience) parts.push(`קהל יעד: ${targetAudience}`);
        if (costInfo) parts.push(`עלות: ${costInfo}`);
        if (location) parts.push(`מיקום: ${location}`);
        if (contactInfo) parts.push(`פרטי קשר: ${contactInfo}`);

        const contentText = parts.join(" | ");

        console.log(`Seeding solution: "${serviceName.substring(0, 40)}..."`);

        try {
          const embedding = await gemini.getEmbedding(contentText);
          await db.insert(solutions).values({
            id: crypto.randomUUID(),
            category: sheetName,
            subcategory: subcategory || null,
            serviceName,
            description: description || null,
            targetAudience: targetAudience || null,
            costInfo: costInfo || null,
            location: location || null,
            contactInfo: contactInfo || null,
            contentText,
            embedding,
            sourceSheet: sheetName,
            datasetVersion,
          });
        } catch (error: any) {
          console.error(`Error embedding/seeding solution "${serviceName.substring(0, 30)}":`, error.message);
        }
      }
    }
  }

  console.log("Seeding process completed successfully!");
}

seed().catch((err) => {
  console.error("Unhandle error in seed script:", err);
  process.exit(1);
});
