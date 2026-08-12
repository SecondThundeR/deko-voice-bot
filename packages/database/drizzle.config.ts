import { defineConfig } from "drizzle-kit";

import { databaseUrl } from "./src/env.ts";

export default defineConfig({
    schema: "./src/schema.ts",
    out: "./src/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
    },
    casing: "snake_case",
});
