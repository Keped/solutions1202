import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db";
import { chatSessions, chatMessages } from "../../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getUserFromRequest } from "../../../lib/auth";
import { generateRAGResponse } from "../../../lib/rag";
import crypto from "crypto";
import { ChatMessage } from "../../../lib/providers/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, message } = await req.json();

    if (!sessionId || !message || typeof message !== "string") {
      return NextResponse.json(
        { error: "sessionId and message are required" },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user.id)))
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Save user message
    const userMessageId = crypto.randomUUID();
    const userMessage = {
      id: userMessageId,
      sessionId,
      role: "user",
      content: message.trim(),
      sources: null,
      createdAt: new Date(),
    };
    await db.insert(chatMessages).values(userMessage);

    // Fetch message history for LLM (limit to last 10 for context window)
    const historyDb = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    // Exclude the message we just added since it will be appended manually in generateRAGResponse,
    // or format it, keeping roles correct.
    const history: ChatMessage[] = historyDb
      .filter((m) => m.id !== userMessageId)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Call RAG pipeline
    const { answer, sources } = await generateRAGResponse(message.trim(), history);

    // Save assistant message
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage = {
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: answer,
      sources: sources,
      createdAt: new Date(),
    };
    await db.insert(chatMessages).values(assistantMessage);

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
