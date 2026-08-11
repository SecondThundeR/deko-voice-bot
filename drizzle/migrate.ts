import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { databaseUrl } from "./env.ts";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log("Started running migrations");

    const client = postgres(databaseUrl, { max: 1 });

    try {
        await migrate(drizzle(client), {
            migrationsFolder: path.join(import.meta.dirname, "migrations"),
        });
    } finally {
        await client.end();
    }

    console.log("Finished migrations");
}
