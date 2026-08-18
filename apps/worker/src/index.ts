import { randomUUID } from "node:crypto";
import { hostname } from "node:os";

import {
    checkDatabaseConnection,
    closeDatabaseConnection,
} from "@deko-voice-bot/database/db.js";
import { config } from "./config.ts";
import { logger } from "./logger.ts";
import { runtimeDependencies } from "./runtime-dependencies.ts";
import { createWorker } from "./worker.ts";

const owner = `worker:${hostname()}:${process.pid}:${randomUUID()}`;
const worker = createWorker(runtimeDependencies, {
    owner,
    leaseMs: config.leaseMs,
    pollIntervalMs: config.pollIntervalMs,
});

let shuttingDown = false;
async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ owner }, "Worker shutting down");
    await worker.stop();
    await closeDatabaseConnection();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
    await checkDatabaseConnection();
    logger.info({ owner }, "Database connection established");
    logger.info({ owner }, "Outbox worker started");
    await worker.start();
} catch (error) {
    logger.error({ error }, "Worker stopped unexpectedly");
    process.exitCode = 1;
    await shutdown();
}
