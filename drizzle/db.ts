import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);
export const db = drizzle(sql, {
    logger: process.env.NODE_ENV === "development",
});
