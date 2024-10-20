import { Bot } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import { I18n } from "@grammyjs/i18n";
import { autoRetry } from "@grammyjs/auto-retry";
import { conversations, createConversation } from "@grammyjs/conversations";

import { exportDataCommand } from "@/src/commands/pm/admin/exportData";
import { fullStatsCommand } from "@/src/commands/pm/admin/fullStats";
import { maintenanceCommand } from "@/src/commands/pm/admin/maintenance";
import { newRemoteVoicesCommand } from "@/src/commands/pm/admin/newRemoteVoices";
import { newVoicesCommand } from "@/src/commands/pm/admin/newVoices";
import { statsCommand } from "@/src/commands/pm/admin/stats";
import { voiceCommand } from "@/src/commands/pm/admin/voice";
import { voicesCommand } from "@/src/commands/pm/admin/voices";
import { favoritesCommand } from "@/src/commands/pm/favorites";
import { myDataCommand } from "@/src/commands/pm/myData";
import { optInCommand } from "@/src/commands/pm/optIn";
import { optOutCommand } from "@/src/commands/pm/optOut";
import { privacyCommand } from "@/src/commands/pm/privacy";
import { startCommand } from "@/src/commands/pm/start";
import { cancelCommand } from "@/src/commands/cancel";

import { CONVERSATIONS } from "@/src/constants/conversations";
import { ADMIN_IDS_CHECK_FAIL, ENVS_CHECK_FAIL } from "@/src/constants/locale";

import { favoritesMenu } from "@/src/menu/favorites";
import { voiceMenu } from "@/src/menu/voice";
import { voicesMenu } from "@/src/menu/voices";

import {
    getSessionKey,
    registerAdminCommands,
    registerUserCommands,
} from "@/src/helpers/api";

import { catchHandler } from "@/src/handlers/catch";
import { importDataHandler } from "@/src/handlers/importData";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery";
import { voiceItemHandler } from "@/src/handlers/voiceItem";

import { configSetup } from "@/src/middlewares/configSetup";
import { maintenanceGatekeep } from "@/src/middlewares/maintenanceGatekeep";
import { sessionSetup } from "@/src/middlewares/sessionSetup";

import type { BotContext } from "@/src/types/bot";

const token = process.env.BOT_TOKEN;
const adminIds = process.env.ADMIN_IDS;

if (!adminIds) {
    console.error(ADMIN_IDS_CHECK_FAIL);
    process.exit(1);
}

if (!token || !process.env.DATABASE_URL) {
    console.error(ENVS_CHECK_FAIL);
    process.exit(1);
}

const bot = new Bot<BotContext>(token);
const i18n = new I18n<BotContext>({
    defaultLocale: "ru",
    directory: "locales",
    globalTranslationContext: (ctx) => ({
        botUsername: `@${ctx.me.username}`,
    }),
});

bot.api.config.use(autoRetry());

bot.use(sequentialize(getSessionKey))
    .use(i18n)
    .use(configSetup(adminIds))
    .use(await sessionSetup())
    .use(conversations())
    .use(maintenanceGatekeep)
    .use(inlineQueryHandler)
    .use(cancelCommand);

CONVERSATIONS.forEach(([id, conversation]) => {
    bot.use(createConversation(conversation, id));
});

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
const pmAdmin = pm.filter((ctx) => ctx.config.isAdmin);

pm.use(favoritesMenu)
    .use(startCommand)
    .use(myDataCommand)
    .use(optInCommand)
    .use(optOutCommand)
    .use(privacyCommand)
    .use(favoritesCommand);

pmAdmin
    .use(importDataHandler)
    .use(voicesMenu)
    .use(voiceMenu)
    .use(voiceItemHandler)
    .use(maintenanceCommand)
    .use(fullStatsCommand)
    .use(statsCommand)
    .use(newVoicesCommand)
    .use(newRemoteVoicesCommand)
    .use(voiceCommand)
    .use(voicesCommand)
    .use(exportDataCommand);

bot.catch(catchHandler);

const runner = run(bot);

const stopRunner = async () => {
    if (runner.isRunning()) {
        await runner.stop();
    }
    process.exit();
};

process.on("SIGINT", stopRunner);
process.on("SIGTERM", stopRunner);
process.on("uncaughtException", (error) => {
    console.error("Caught unhandled exception", { error });
});

try {
    await Promise.all([
        registerUserCommands(bot.api),
        registerAdminCommands(bot.api, adminIds),
    ]);

    const { first_name, username } = await bot.api.getMe();
    console.log(
        `Started as ${first_name} (@${username})\nRunning on Bun ${Bun.version}`,
    );
} catch (e) {
    console.error(e);
}
