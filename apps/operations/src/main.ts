import { serve } from "@hono/node-server";

import { canRunFFmpeg } from "./audio.ts";
import { config } from "./config.ts";
import { createOperationsServer } from "./server.ts";

const ffmpegAvailable = await canRunFFmpeg();
const app = createOperationsServer(config, { ffmpegAvailable });
const server = serve({
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,
});

async function shutdown() {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await app.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
