import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const dbUrlString: string = dbUrl;

async function enableVector() {
  console.log("Connecting to database and enabling vector extension...");
  const sql = neon(dbUrlString);
  
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("SUCCESS: 'vector' extension is now enabled!");
  } catch (error) {
    console.error("Failed to enable vector extension:", error);
    process.exit(1);
  }
}

enableVector();
