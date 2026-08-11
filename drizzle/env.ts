import { parseDatabaseUrl } from "./database-url.ts";

try {
    process.loadEnvFile();
} catch (error) {
    if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "ENOENT"
    ) {
        throw error;
    }
}

export const databaseUrl = parseDatabaseUrl(process.env.DATABASE_URL);
