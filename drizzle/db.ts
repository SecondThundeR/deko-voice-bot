import { drizzle } from "drizzle-orm/postgres-js";

export const db = drizzle({
    connection: Bun.env.DATABASE_URL,
    casing: "snake_case",
    logger: Bun.env.NODE_ENV === "development",
});
