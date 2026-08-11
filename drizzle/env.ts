import { loadEnvironmentFile } from "#root/environment.js";
import { parseDatabaseUrl } from "./database-url.ts";

loadEnvironmentFile();

export const databaseUrl = parseDatabaseUrl(process.env.DATABASE_URL);
