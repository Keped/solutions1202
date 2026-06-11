import { db } from "../db";
import { solutions, faqEntries } from "../db/schema";
import { sql, desc, and } from "drizzle-orm";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { ChatMessage } from "./providers/types";

// Initialize providers
const gemini = new GeminiProvider();
let groq: GroqProvider | null = null;

try {
  if (process.env.GROQ_API_KEY) {
    groq = new GroqProvider();
  }
} catch (e) {
  console.warn("Failed to initialize Groq provider:", e);
}

// Helper to check if a string contains Hebrew letters
export function isHebrew(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

export async function searchSolutions(queryEmbedding: number[], limit = 5, threshold = 0.5) {
  // pgvector cosine similarity calculation: 1 - (embedding <=> query_embedding)
  // cosine distance range is 0 to 2 (0 being identical, 2 being opposite)
  // similarity = 1 - cosine_distance
  const vectorStr = `[${queryEmbedding.join(",")}]`;
  const similarity = sql<number>`1 - (${solutions.embedding} <=> ${vectorStr}::vector)`;

  const results = await db
    .select({
      id: solutions.id,
      category: solutions.category,
      subcategory: solutions.subcategory,
      serviceName: solutions.serviceName,
      description: solutions.description,
      targetAudience: solutions.targetAudience,
      costInfo: solutions.costInfo,
      location: solutions.location,
      contactInfo: solutions.contactInfo,
      contentText: solutions.contentText,
      sourceSheet: solutions.sourceSheet,
      similarity: similarity,
    })
    .from(solutions)
    .where(and(sql`${solutions.embedding} IS NOT NULL`, sql`1 - (${solutions.embedding} <=> ${vectorStr}::vector) >= ${threshold}`))
    .orderBy(desc(similarity))
    .limit(limit);

  return results;
}

export async function searchFaqs(queryEmbedding: number[], limit = 3, threshold = 0.6) {
  const vectorStr = `[${queryEmbedding.join(",")}]`;
  const similarity = sql<number>`1 - (${faqEntries.embedding} <=> ${vectorStr}::vector)`;

  const results = await db
    .select({
      id: faqEntries.id,
      topic: faqEntries.topic,
      question: faqEntries.question,
      suggestedAnswer: faqEntries.suggestedAnswer,
      similarity: similarity,
    })
    .from(faqEntries)
    .where(and(sql`${faqEntries.embedding} IS NOT NULL`, sql`1 - (${faqEntries.embedding} <=> ${vectorStr}::vector) >= ${threshold}`))
    .orderBy(desc(similarity))
    .limit(limit);

  return results;
}

export async function generateRAGResponse(
  query: string,
  history: ChatMessage[] = []
): Promise<{ answer: string; sources: any[] }> {
  // 1. Get embedding for the query
  const queryEmbedding = await gemini.getEmbedding(query);

  // 2. Query solutions and FAQs
  const foundSolutions = await searchSolutions(queryEmbedding, 5, 0.4);
  const foundFaqs = await searchFaqs(queryEmbedding, 2, 0.5);

  // 3. Format sources for user
  const sources = [
    ...foundFaqs.map((f) => ({
      type: "faq",
      id: f.id,
      title: `שאלות ותשובות: ${f.question}`,
      content: f.suggestedAnswer,
      similarity: f.similarity,
    })),
    ...foundSolutions.map((s) => ({
      type: "solution",
      id: s.id,
      title: s.serviceName,
      category: s.category,
      subcategory: s.subcategory,
      content: s.description || s.contentText,
      contactInfo: s.contactInfo,
      location: s.location,
      costInfo: s.costInfo,
      sourceSheet: s.sourceSheet,
      similarity: s.similarity,
    })),
  ];

  // 4. Construct context text
  let contextText = "";
  if (foundFaqs.length > 0) {
    contextText += "--- שאלות ותשובות נפוצות (FAQs) ---\n";
    foundFaqs.forEach((faq) => {
      contextText += `שאלה: ${faq.question}\nתשובה: ${faq.suggestedAnswer}\n\n`;
    });
  }

  if (foundSolutions.length > 0) {
    contextText += "--- שירותים ופתרונות זמינים ---\n";
    foundSolutions.forEach((sol) => {
      contextText += `שם השירות: ${sol.serviceName}\n`;
      contextText += `קטגוריה: ${sol.category} (${sol.subcategory || ""})\n`;
      if (sol.description) contextText += `תיאור: ${sol.description}\n`;
      if (sol.targetAudience) contextText += `קהל יעד: ${sol.targetAudience}\n`;
      if (sol.costInfo) contextText += `עלויות: ${sol.costInfo}\n`;
      if (sol.location) contextText += `מיקום: ${sol.location}\n`;
      if (sol.contactInfo) contextText += `פרטי קשר: ${sol.contactInfo}\n`;
      contextText += `פרטים נוספים: ${sol.contentText}\n\n`;
    });
  }

  // 5. Detect language to choose correct response guidance
  const hebrewUser = isHebrew(query);

  let systemPrompt = "";
  if (hebrewUser) {
    systemPrompt = `אתה עוזר וירטואלי מקצועי ואדיב עבור אפליקציית "Solutions Chat" (צ'אט פתרונות).
תפקידך לסייע למשתמשים למצוא שירותים, מענים ופתרונות בהתבסס אך ורק על המידע המצורף בהקשר (Context).
הנחיות חשובות:
1. עליך לענות בשפה העברית בצורה ברורה, תמציתית ומזמינה (RTL).
2. אם אינך מוצא פתרון מתאים בהקשר המצורף, ענה בנימוס שאינך יודע או שאין מידע מתאים במערכת. אל תמציא פרטים או שמות שירותים.
3. הדגש פרטי קשר, דרכי הגעה או עלויות בצורה נוחה לקריאה.
4. השתמש במידע מההקשר הבא בלבד לצורך מתן התשובה:
\n${contextText}`;
  } else {
    systemPrompt = `You are a professional and helpful virtual assistant for the "Solutions Chat" application.
Your job is to assist users in finding services, responses, and solutions based solely on the provided Context.
Instructions:
1. Respond in English, keeping it clear and structured.
2. If you cannot find a suitable solution in the context, politely state that you don't know or that no matching information is found in the system. Do not hallucinate or make up details.
3. Highlight contact details, locations, or costs in an easy-to-read format.
4. Use only the following context:
\n${contextText}`;
  }

  // 6. Select provider (Groq is preferred for speed if available, otherwise fallback to Gemini)
  const provider = groq || gemini;

  // 7. Call LLM
  // Combine chat messages history and add the latest query at the end
  const messages: ChatMessage[] = [...history, { role: "user", content: query }];
  
  const answer = await provider.generateResponse(messages, systemPrompt);

  return {
    answer,
    sources,
  };
}
