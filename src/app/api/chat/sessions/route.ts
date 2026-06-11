import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { chatSessions } from "../../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserFromRequest } from "../../../../lib/auth";
import crypto from "crypto";

// GET sessions for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, user.id))
      .orderBy(desc(chatSessions.createdAt));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST to create a new session
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { title } = await req.json().catch(() => ({}));
    if (!title || typeof title !== "string") {
      title = "שיחה חדשה";
    }

    const newSession = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: title.trim(),
      createdAt: new Date(),
    };

    await db.insert(chatSessions).values(newSession);

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
