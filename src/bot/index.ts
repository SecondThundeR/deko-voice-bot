import { autoChatAction } from "@grammyjs/auto-chat-action";
import { type ConversationData, conversations } from "@grammyjs/conversations";
import { hydrate } from "@grammyjs/hydrate";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { sequentialize } from "@grammyjs/runner";
import { type BotConfig, Bot as TelegramBot } from "grammy";
import type { Config } from "#root/config.js";
import type { Logger } from "#root/logger.js";
import type { Context, SessionData } from "./context.ts";
import { donateConversation } from "./conversations/donate.ts";
import { newVoicesConversation } from "./conversations/new-voices.ts";
import { updateVoiceFileConversation } from "./conversations/update-voice-file.ts";
import { updateVoiceIDConversation } from "./conversations/update-voice-id.ts";
import { updateVoiceTitleConversation } from "./conversations/update-voice-title.ts";
import { cancelFeature } from "./features/cancel.ts";
import { donateFeature } from "./features/donate.ts";
import { exportFeature } from "./features/export.ts";
import { favoritesFeature } from "./features/favorites.ts";
import { fullStatsFeature } from "./features/full-stats.ts";
import { importDataFeature } from "./features/import-data.ts";
import { inlineQueryFeature } from "./features/inline-query.ts";
import { maintenanceFeature } from "./features/maintenance.ts";
import { mydataFeature } from "./features/my-data.ts";
import { newVoicesFeature } from "./features/new-voices.ts";
import { optinFeature } from "./features/opt-in.ts";
import { optoutFeature } from "./features/opt-out.ts";
import { privacyFeature } from "./features/privacy.ts";
import { refundFeature } from "./features/refund.ts";
import { setCommandsFeature } from "./features/set-commands.ts";
import { startFeature } from "./features/start.ts";
import { statsFeature } from "./features/stats.ts";
import { unhandledFeature } from "./features/unhandled.ts";
import { voiceFeature } from "./features/voice.ts";
import { voiceItemFeature } from "./features/voice-item.ts";
import { voicesFeature } from "./features/voices.ts";
import { isAdmin } from "./filter/is-admin.ts";
import { errorHandler } from "./handlers/error.ts";
import { i18n } from "./i18n.ts";
import { favoritesMenu } from "./menu/favorites.ts";
import { voiceMenu } from "./menu/voice.ts";
import { voicesMenu } from "./menu/voices.ts";
import { maintenanceGatekeep } from "./middlewares/maintenance-gatekeep.ts";
import { session } from "./middlewares/session.ts";
import { updateLogger } from "./middlewares/update-logger.ts";
import {
    createTtlMemoryStorage,
    createTtlVersionedMemoryStorage,
} from "./store/ttl-memory-storage.ts";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

interface Dependencies {
    config: Config;
    logger: Logger;
}

function getSessionKey(ctx: Omit<Context, "session">) {
    return ctx.from?.id.toString() || ctx.chat?.id.toString();
}

export function createBot(
    token: string,
    dependencies: Dependencies,
    botConfig?: BotConfig<Context>,
) {
    const { config, logger } = dependencies;
    const sessionStorage = createTtlMemoryStorage<SessionData>({
        cleanupIntervalMs: STORAGE_CLEANUP_INTERVAL_MS,
        ttlMs: SESSION_TTL_MS,
    });
    const conversationStorage =
        createTtlVersionedMemoryStorage<ConversationData>({
            cleanupIntervalMs: STORAGE_CLEANUP_INTERVAL_MS,
            ttlMs: SESSION_TTL_MS,
        });

    const bot = new TelegramBot<Context>(token, botConfig);

    bot.use(async (ctx, next) => {
        ctx.config = config;
        ctx.logger = logger.child({
            update_id: ctx.update.update_id,
        });

        await next();
    });

    const protectedBot = bot.errorBoundary(errorHandler);

    // Middlewares
    bot.api.config.use(parseMode("HTML"));

    if (config.isPollingMode) {
        protectedBot.use(sequentialize(getSessionKey));
    }
    if (config.isDebug) {
        protectedBot.use(updateLogger());
    }
    protectedBot.use(autoChatAction(bot.api));
    protectedBot.use(hydrateReply);
    protectedBot.use(hydrate());
    protectedBot.use(
        session({
            getSessionKey,
            storage: sessionStorage,
        }),
    );
    protectedBot.use(i18n);
    protectedBot.use(
        conversations({
            plugins: [i18n],
            storage: {
                adapter: conversationStorage,
                getStorageKey: getSessionKey,
                type: "key",
            },
        }),
    );
    protectedBot.use(maintenanceGatekeep());
    protectedBot.use(inlineQueryFeature);
    protectedBot.use(cancelFeature);
    protectedBot.use(newVoicesConversation());
    protectedBot.use(updateVoiceFileConversation());
    protectedBot.use(updateVoiceTitleConversation());
    protectedBot.use(updateVoiceIDConversation());
    protectedBot.use(donateConversation());

    // Menu
    protectedBot.use(favoritesMenu);
    protectedBot.filter(isAdmin).use(voicesMenu).use(voiceMenu);

    // Handlers
    protectedBot.use(startFeature);
    protectedBot.use(donateFeature);
    protectedBot.use(favoritesFeature);
    protectedBot.use(privacyFeature);
    protectedBot.use(mydataFeature);
    protectedBot.use(optinFeature);
    protectedBot.use(optoutFeature);
    protectedBot.use(exportFeature);
    protectedBot.use(statsFeature);
    protectedBot.use(fullStatsFeature);
    protectedBot.use(maintenanceFeature);
    protectedBot.use(refundFeature);
    protectedBot.use(voiceFeature);
    protectedBot.use(voicesFeature);
    protectedBot.use(newVoicesFeature);
    protectedBot.use(importDataFeature);
    protectedBot.use(voiceItemFeature);
    protectedBot.use(setCommandsFeature);

    // must be the last handler
    protectedBot.use(unhandledFeature);

    return bot;
}

export type Bot = ReturnType<typeof createBot>;
