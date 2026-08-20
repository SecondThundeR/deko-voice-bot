import { defineConfig } from "drizzle-kit";

import { databaseUrl } from "./drizzle/env.ts";

export default defineConfig({
    schema: "./drizzle/schema.ts",
    out: "./drizzle/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
    },
    casing: "snake_case",
});
