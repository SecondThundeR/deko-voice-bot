import { run } from "@grammyjs/runner";
import {
    loadIgnoredUsers,
    startUsageStatsFlushInterval,
    stopUsageStatsFlushInterval,
} from "drizzle/queries/usage-stats";

import { createBot } from "./bot";
import { config, type PollingConfig, type WebhookConfig } from "./config";
import { createLifecycle } from "./lifecycle";
import { logger } from "./logger";
import { createServer, createServerManager } from "./server";

const lifecycle = createLifecycle(logger);

async function setupUsageStats() {
    await loadIgnoredUsers(logger);
    startUsageStatsFlushInterval((error) => logger.error(error), logger);
    lifecycle.onShutdown(() => stopUsageStatsFlushInterval(logger));
}

async function startPolling(config: PollingConfig) {
    const bot = createBot(config.botToken, {
        config,
        logger,
    });

    await Promise.all([bot.init(), bot.api.deleteWebhook()]);
    await setupUsageStats();

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
    const server = createServer({
        bot,
        config,
        logger,
    });
    const serverManager = createServerManager(server, {
        host: config.serverHost,
        port: config.serverPort,
    });

    // to prevent receiving updates before the bot is ready
    await bot.init();
    await setupUsageStats();

    const info = serverManager.start();
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
        url: config.botWebhook,
    });
}

try {
    if (config.isWebhookMode) {
        await startWebhook(config);
    } else if (config.isPollingMode) {
        await startPolling(config);
    } else {
        throw new Error(
            "Bot config matches neither webhook nor polling mode",
        );
    }
} catch (error) {
    logger.error(error);
    await lifecycle.shutdown(1);
}
