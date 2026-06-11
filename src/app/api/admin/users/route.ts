import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { users } from "../../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserFromRequest, hashPassword } from "../../../../lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getUserFromRequest(req);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getUserFromRequest(req);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const targetRole = role === "admin" ? "admin" : "user";
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUserId = crypto.randomUUID();

    const newUser = {
      id: newUserId,
      email: cleanEmail,
      passwordHash,
      role: targetRole,
      createdAt: new Date(),
    };

    await db.insert(users).values(newUser);

    return NextResponse.json({
      user: {
        id: newUserId,
        email: cleanEmail,
        role: targetRole,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
