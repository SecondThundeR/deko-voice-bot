import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle({
    connection: process.env.DATABASE_URL!,
    casing: "snake_case",
    logger: process.env.NODE_ENV === "development",
});
