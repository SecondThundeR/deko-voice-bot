import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { databaseUrl } from "./env.ts";

const databaseOptions = {
    idle_timeout: 20,
    max: 5,
} as const;

let client = postgres(databaseUrl, databaseOptions);

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
    await client.end({ timeout: 5 });
}

export async function withDatabaseDisconnected<T>(operation: () => Promise<T>) {
    await closeDatabaseConnection();
    try {
        return await operation();
    } finally {
        client = postgres(databaseUrl, databaseOptions);
        db = drizzle({ client, casing: "snake_case", logger: false });
        await checkDatabaseConnection();
    }
}
