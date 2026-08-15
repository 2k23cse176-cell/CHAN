import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;
const useRenderSsl = Boolean(
  connectionString && (connectionString.includes("render.com") || process.env.NODE_ENV === "production")
);

export const pool = new Pool({
  connectionString,
  ssl: useRenderSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
