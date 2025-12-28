import { SQL } from "bun";
import { config } from "../config";
import { drizzle } from "drizzle-orm/bun-sql";

console.log("Connected to database.");
const client = new SQL(config.databaseURL);
export const db = drizzle({ client });