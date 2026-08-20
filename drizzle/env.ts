import { loadEnvironmentFile } from "#root/environment.js";
import { parseDatabaseUrlFromEnvironment } from "./database-url.ts";

loadEnvironmentFile();

export const databaseUrl = parseDatabaseUrlFromEnvironment(
    process.env.DATABASE_URL,
);
