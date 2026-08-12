import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseUrl } from "./env.ts";

let client = postgres(databaseUrl);

export let db = drizzle({
    client,
    casing: "snake_case",
    // Drizzle's query logger includes bound values, which may contain personal data.
    logger: false,
});

export async function checkDatabaseConnection() {
    await client`select 1`;
}

export async function closeDatabaseConnection() {
    await client.end({ timeout: 5 });
}

export async function resetDatabaseConnection() {
    await closeDatabaseConnection();
    client = postgres(databaseUrl);
    db = drizzle({ client, casing: "snake_case", logger: false });
    await checkDatabaseConnection();
}
