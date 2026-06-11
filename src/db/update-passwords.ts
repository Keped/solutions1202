import "dotenv/config";
import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth";

async function updatePasswords() {
  console.log("Starting password updates...");
  
  const newPassword = "S0daStream!@";
  const newPasswordHash = await hashPassword(newPassword);
  
  try {
    // Update Admin Password
    const adminEmail = "admin@solutions.com";
    const [adminUser] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (adminUser) {
      await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, adminUser.id));
      console.log(`Successfully updated password for ${adminEmail}`);
    } else {
      console.log(`User ${adminEmail} not found, skipping.`);
    }

    // Update Regular User Password
    const userEmail = "user@solutions.com";
    const [normalUser] = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (normalUser) {
      await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, normalUser.id));
      console.log(`Successfully updated password for ${userEmail}`);
    } else {
      console.log(`User ${userEmail} not found, skipping.`);
    }

    console.log("All password updates completed!");
  } catch (error) {
    console.error("Error updating passwords:", error);
    process.exit(1);
  }
}

updatePasswords();
