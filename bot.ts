import { Bot } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import { I18n } from "@grammyjs/i18n";
import { autoRetry } from "@grammyjs/auto-retry";
import { conversations, createConversation } from "@grammyjs/conversations";

import { exportDataCommand } from "@/src/commands/pm/creator/exportData";
import { fullStatsCommand } from "@/src/commands/pm/creator/fullStats";
import { maintenanceCommand } from "@/src/commands/pm/creator/maintenance";
import { newRemoteVoicesCommand } from "@/src/commands/pm/creator/newRemoteVoices";
import { newVoicesCommand } from "@/src/commands/pm/creator/newVoices";
import { statsCommand } from "@/src/commands/pm/creator/stats";
import { voiceCommand } from "@/src/commands/pm/creator/voice";
import { voicesCommand } from "@/src/commands/pm/creator/voices";
import { favoritesCommand } from "@/src/commands/pm/favorites";
import { myDataCommand } from "@/src/commands/pm/myData";
import { optInCommand } from "@/src/commands/pm/optIn";
import { optOutCommand } from "@/src/commands/pm/optOut";
import { privacyCommand } from "@/src/commands/pm/privacy";
import { startCommand } from "@/src/commands/pm/start";
import { cancelCommand } from "@/src/commands/cancel";

import { CONVERSATIONS } from "@/src/constants/conversations";
import { ENVS_CHECK_FAIL } from "@/src/constants/locale";

import { favoritesMenu } from "@/src/menu/favorites";
import { voiceMenu } from "@/src/menu/voice";
import { voicesMenu } from "@/src/menu/voices";

import {
    getSessionKey,
    registerCreatorCommands,
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
const creatorID = process.env.CREATOR_ID;

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
    .use(configSetup(creatorID))
    .use(await sessionSetup())
    .use(conversations())
    .use(maintenanceGatekeep)
    .use(inlineQueryHandler)
    .use(cancelCommand);

CONVERSATIONS.forEach(([id, conversation]) => {
    bot.use(createConversation(conversation, id));
});

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
const pmCreator = pm.filter((ctx) => ctx.config.isCreator);

pm.use(favoritesMenu)
    .use(startCommand)
    .use(myDataCommand)
    .use(optInCommand)
    .use(optOutCommand)
    .use(privacyCommand)
    .use(favoritesCommand);

pmCreator
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
        registerCreatorCommands(bot.api, creatorID),
    ]);

    const { first_name, username } = await bot.api.getMe();
    console.log(
        `Started as ${first_name} (@${username})\nRunning on Bun ${Bun.version}`,
    );
} catch (e) {
    console.error(e);
}
