import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import 'dotenv/config'; // Load environment variables directly here too

neonConfig.webSocketConstructor = ws;

// Debug logging
console.log("Environment check in db.ts");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  // Try hardcoding the database URL from the .env file for testing
  const dbUrl = "postgresql://neondb_owner:npg_9O3mdNDYLeIC@ep-damp-salad-a6i2ruqe.us-west-2.aws.neon.tech/neondb?sslmode=require";
  console.log("Setting fallback DATABASE_URL");
  process.env.DATABASE_URL = dbUrl;
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });