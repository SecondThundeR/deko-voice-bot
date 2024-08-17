import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (import.meta.main) {
    console.log("Started running migrations");

    const client = postgres(process.env.DATABASE_URL!, { max: 1 });
    await migrate(drizzle(client), {
        migrationsFolder: "drizzle/migrations",
    });
    await client.end();

    console.log("Finished migrations");
}
