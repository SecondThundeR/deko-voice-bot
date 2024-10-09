import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    casing: "snake_case",
});
