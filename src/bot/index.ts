import { autoChatAction } from "@grammyjs/auto-chat-action";
import { type ConversationData, conversations } from "@grammyjs/conversations";
import { hydrate } from "@grammyjs/hydrate";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { sequentialize } from "@grammyjs/runner";
import { type BotConfig, Bot as TelegramBot } from "grammy";
import type { Config } from "../config";
import type { Logger } from "../logger";
import type { Context, SessionData } from "./context";
import { donateConversation } from "./conversations/donate";
import { newVoicesConversation } from "./conversations/new-voices";
import { updateVoiceFileConversation } from "./conversations/update-voice-file";
import { updateVoiceIDConversation } from "./conversations/update-voice-id";
import { updateVoiceTitleConversation } from "./conversations/update-voice-title";
import { cancelFeature } from "./features/cancel";
import { donateFeature } from "./features/donate";
import { exportFeature } from "./features/export";
import { fullStatsFeature } from "./features/full-stats";
import { importDataFeature } from "./features/import-data";
import { inlineQueryFeature } from "./features/inline-query";
import { maintenanceFeature } from "./features/maintenance";
import { mydataFeature } from "./features/my-data";
import { newVoicesFeature } from "./features/new-voices";
import { optinFeature } from "./features/opt-in";
import { optoutFeature } from "./features/opt-out";
import { privacyFeature } from "./features/privacy";
import { refundFeature } from "./features/refund";
import { setCommandsFeature } from "./features/set-commands";
import { startFeature } from "./features/start";
import { statsFeature } from "./features/stats";
import { unhandledFeature } from "./features/unhandled";
import { voiceFeature } from "./features/voice";
import { voiceItemFeature } from "./features/voice-item";
import { voicesFeature } from "./features/voices";
import { isAdmin } from "./filter/is-admin";
import { errorHandler } from "./handlers/error";
import { i18n } from "./i18n";
import { favoritesMenu } from "./menu/favorites";
import { voiceMenu } from "./menu/voice";
import { voicesMenu } from "./menu/voices";
import { maintenanceGatekeep } from "./middlewares/maintenance-gatekeep";
import { session } from "./middlewares/session";
import { updateLogger } from "./middlewares/update-logger";
import {
    createTtlMemoryStorage,
    createTtlVersionedMemoryStorage,
} from "./store/ttl-memory-storage";

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
