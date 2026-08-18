import { closeDatabaseConnection } from "@deko-voice-bot/database/db.js";
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { config } from "./config/index.ts";
import { runtimeDependencies } from "./dependencies/runtime.ts";
import { logger } from "./observability/logger.ts";

const app = createApp(runtimeDependencies);

const server = serve(
    { fetch: app.fetch, hostname: "0.0.0.0", port: config.port },
    ({ address, port }) => logger.info({ address, port }, "API listening"),
);

let shuttingDown = false;
async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    runtimeDependencies.readiness.setDraining?.(true);
    server.close();
    await closeDatabaseConnection();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export type { App } from "./app.ts";
