import { loadEnvironmentFile } from "@deko-voice-bot/shared";
import { parseDatabaseUrlFromEnvironment } from "./database-url.ts";

loadEnvironmentFile();

export const databaseUrl = parseDatabaseUrlFromEnvironment(
    process.env.DATABASE_URL,
);
