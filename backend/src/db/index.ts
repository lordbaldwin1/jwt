import pg from "pg";
import { config } from "../config";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new pg.Pool({
  connectionString: config.databaseURL,
});

console.log("Connected to database.");
export const db = drizzle({ client: pool });
