import { serve } from "@hono/node-server";
import type { Update } from "grammy/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import type { Bot } from "#root/bot/index.js";
import type { Config } from "#root/config.js";
import type { Logger } from "#root/logger.js";
import { getSafeErrorInfo } from "#root/logging.js";
import type { WebhookInbox } from "#root/webhook/inbox.js";

import type { Env } from "./environment.ts";
import { requestId, requestLogger, setLogger } from "./middlewares.ts";

interface Dependencies {
    bot: Bot;
    config: Config;
    logger: Logger;
    inbox?: WebhookInbox;
}

export function createServer(dependencies: Dependencies) {
    const { config, inbox, logger } = dependencies;

    const server = new Hono<Env>();

    server.use(requestId());
    server.use(setLogger(logger));
    if (config.isDebug) {
        server.use(requestLogger());
    }

    server.onError(async (error, c) => {
        if (error instanceof HTTPException) {
            const logData = {
                msg: "HTTP request failed",
                status: error.status,
                ...getSafeErrorInfo(error),
            };

            if (error.status < 500) {
                c.var.logger.info(logData);
            } else {
                c.var.logger.error(logData);
            }

            return error.getResponse();
        }

        // unexpected error
        c.var.logger.error({
            msg: "Unexpected HTTP request failure",
            ...getSafeErrorInfo(error),
            method: c.req.raw.method,
        });
        return c.json(
            {
                error: "Oops! Something went wrong.",
            },
            500,
        );
    });

    server.get("/", (c) => c.json({ status: true }));

    if (config.botMode === "webhook") {
        if (!inbox) throw new Error("Webhook inbox dependency is required");
        server.post("/webhook", async (c) => {
            if (
                c.req.header("x-telegram-bot-api-secret-token") !==
                config.botWebhookSecret
            ) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const update = await c.req.json<Update>();
            if (
                !Number.isSafeInteger(update.update_id) ||
                update.update_id < 0
            ) {
                return c.json({ error: "Invalid Telegram update" }, 400);
            }
            await inbox.enqueue(update);
            return c.json({ ok: true });
        });
    }

    return server;
}

export type Server = Awaited<ReturnType<typeof createServer>>;

export function createServerManager(
    server: Server,
    options: { host: string; port: number },
) {
    let handle: undefined | ReturnType<typeof serve>;
    return {
        start() {
            return new Promise<{ url: string }>((resolve, reject) => {
                handle = serve(
                    {
                        fetch: server.fetch,
                        hostname: options.host,
                        port: options.port,
                    },
                    (info) =>
                        resolve({
                            url:
                                info.family === "IPv6"
                                    ? `http://[${info.address}]:${info.port}`
                                    : `http://${info.address}:${info.port}`,
                        }),
                );
                handle.once("error", reject);
            });
        },
        stop() {
            return new Promise<void>((resolve) => {
                if (handle) handle.close(() => resolve());
                else resolve();
            });
        },
    };
}
