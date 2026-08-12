import { run } from "@grammyjs/runner";
import {
    checkDatabaseConnection,
    closeDatabaseConnection,
} from "#drizzle/db.js";

import { createBot } from "./bot/index.ts";
import { config, type PollingConfig, type WebhookConfig } from "./config.ts";
import { createLifecycle } from "./lifecycle.ts";
import { logger } from "./logger.ts";
import { getSafeErrorInfo } from "./logging.ts";
import { checkRedisConnection, closeRedisConnection } from "./redis.ts";
import { createServer, createServerManager } from "./server/index.ts";
import { createWebhookInbox, startWebhookWorkers } from "./webhook/inbox.ts";

const lifecycle = createLifecycle(logger);
lifecycle.onShutdown(closeDatabaseConnection);
lifecycle.onShutdown(closeRedisConnection);

async function startPolling(config: PollingConfig) {
    const bot = createBot(config.botToken, {
        config,
        logger,
    });

    await Promise.all([bot.init(), bot.api.deleteWebhook()]);
    const runner = run(bot, {
        runner: {
            fetch: {
                allowed_updates: config.botAllowedUpdates,
            },
        },
    });
    lifecycle.onShutdown(() => runner.stop());

    logger.info({
        msg: "Bot running...",
        username: bot.botInfo.username,
    });
}

async function startWebhook(config: WebhookConfig) {
    const bot = createBot(config.botToken, {
        config,
        logger,
    });
    const inbox = createWebhookInbox();
    const server = createServer({
        bot,
        config,
        inbox,
        logger,
    });
    const serverManager = createServerManager(server, {
        host: config.serverHost,
        port: config.serverPort,
    });

    // to prevent receiving updates before the bot is ready
    await bot.init();
    const stopWorkers = startWebhookWorkers(inbox, bot, logger);
    lifecycle.onShutdown(() => inbox.close());
    lifecycle.onShutdown(stopWorkers);
    const info = await serverManager.start();
    lifecycle.onShutdown(() => serverManager.stop());
    logger.info({
        msg: "Server started",
        url: info.url,
    });

    await bot.api.setWebhook(config.botWebhook, {
        allowed_updates: config.botAllowedUpdates,
        secret_token: config.botWebhookSecret,
    });
    logger.info({
        msg: "Webhook was set",
        webhookOrigin: new URL(config.botWebhook).origin,
    });
}

try {
    const [, isRedisConnected] = await Promise.all([
        checkDatabaseConnection(),
        checkRedisConnection(),
    ]);
    logger.info({ msg: "Database connection established" });
    if (isRedisConnected) {
        logger.info({ msg: "Redis connection established" });
    } else {
        logger.warn({
            msg: "REDIS_URL is not configured; using in-memory session storage",
        });
    }

    if (config.botMode === "webhook") {
        await startWebhook(config);
    } else if (config.botMode === "polling") {
        await startPolling(config);
    } else {
        throw new Error("Bot config matches neither webhook nor polling mode");
    }
} catch (error) {
    logger.error({
        msg: "Application startup failed",
        ...getSafeErrorInfo(error),
    });
    await lifecycle.shutdown(1);
}
