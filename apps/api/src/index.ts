import { closeDatabaseConnection } from "@deko-voice-bot/database/db.js";
import {
    DatabaseMaintenanceError,
    withDatabaseTraffic,
} from "@deko-voice-bot/database/traffic.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { telegramAuth } from "./auth.ts";
import { config } from "./config.ts";
import { HttpError } from "./errors.ts";
import { logger } from "./logger.ts";
import { routes } from "./routes.ts";
import type { ApiEnv } from "./types.ts";

const app = new Hono<ApiEnv>();

app.use(requestId());
app.get("/health", (c) => c.json({ status: true, version: "3.10.0" }));
app.use("/api/v1/*", telegramAuth);
app.use("/api/v1/*", async (_c, next) => withDatabaseTraffic(next));
app.route("/api/v1", routes);

app.notFound((c) =>
    c.json(
        {
            error: {
                code: "NOT_FOUND",
                message: "Маршрут не найден",
                requestId: c.var.requestId,
            },
        },
        404,
    ),
);

app.onError((error, c) => {
    if (error instanceof DatabaseMaintenanceError) {
        c.header("retry-after", "30");
        return c.json(
            {
                error: {
                    code: "MAINTENANCE",
                    message: "Выполняются технические работы",
                    requestId: c.var.requestId,
                },
            },
            503,
        );
    }
    if (error instanceof HttpError) {
        return c.json(
            {
                error: {
                    code: error.code,
                    message: error.message,
                    requestId: c.var.requestId,
                },
            },
            error.status,
        );
    }
    logger.error(
        {
            errorType: error.constructor.name,
            requestId: c.var.requestId,
            stack: error.stack,
        },
        "Unexpected API error",
    );
    return c.json(
        {
            error: {
                code: "INTERNAL_ERROR",
                message: "Что-то пошло не так",
                requestId: c.var.requestId,
            },
        },
        500,
    );
});

const server = serve(
    { fetch: app.fetch, hostname: "0.0.0.0", port: config.port },
    ({ address, port }) => logger.info({ address, port }, "API listening"),
);

let shuttingDown = false;
async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close();
    await closeDatabaseConnection();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export type App = typeof app;
