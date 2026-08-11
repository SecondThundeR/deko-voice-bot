import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseUrl } from "./env.ts";

const client = postgres(databaseUrl);

export const db = drizzle({
    client,
    casing: "snake_case",
    logger: process.env.NODE_ENV === "development",
});

export async function checkDatabaseConnection() {
    await client`select 1`;
}

export async function closeDatabaseConnection() {
    await client.end({ timeout: 5 });
}
