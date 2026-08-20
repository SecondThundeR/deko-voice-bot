import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseUrl } from "./env.ts";

const databaseOptions = {
    idle_timeout: 20,
    max: 5,
} as const;

let client = postgres(databaseUrl, databaseOptions);
let connectionClosed = false;

export let db = drizzle({
    client,
    casing: "snake_case",
    // Drizzle's query logger includes bound values, which may contain personal data
    logger: false,
});

export async function checkDatabaseConnection() {
    await client`select 1`;
}

export async function closeDatabaseConnection() {
    if (connectionClosed) return;
    await client.end({ timeout: 5 });
    connectionClosed = true;
}

export async function reopenDatabaseConnection() {
    if (!connectionClosed) return;
    client = postgres(databaseUrl, databaseOptions);
    db = drizzle({ client, casing: "snake_case", logger: false });
    connectionClosed = false;
    try {
        await checkDatabaseConnection();
    } catch (error) {
        await closeDatabaseConnection();
        throw error;
    }
}

export async function withDatabaseDisconnected<T>(operation: () => Promise<T>) {
    await closeDatabaseConnection();
    try {
        return await operation();
    } finally {
        await reopenDatabaseConnection();
    }
}
