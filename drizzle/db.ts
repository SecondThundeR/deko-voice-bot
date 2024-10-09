import { drizzle } from "drizzle-orm/connect";

export const db = await drizzle("postgres-js", {
    connection: process.env.DATABASE_URL!,
    casing: "snake_case",
    logger: process.env.NODE_ENV === "development",
});
