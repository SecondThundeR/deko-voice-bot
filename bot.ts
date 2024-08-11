import { Bot } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";
import { I18n } from "@grammyjs/i18n";
import { autoRetry } from "@grammyjs/auto-retry";
import { conversations, createConversation } from "@grammyjs/conversations";
import { MongoClient, MongoError } from "mongodb";
import { emitKeypressEvents } from "readline";

import { fullStatsCommand } from "@/src/commands/pm/creator/fullStats";
import { invalidateCommand } from "@/src/commands/pm/creator/invalidate";
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
import { inlineQueryHandler } from "@/src/handlers/inlineQuery";
import { voiceItemHandler } from "@/src/handlers/voiceItem";

import { configSetup } from "@/src/middlewares/configSetup";
import { maintenanceGatekeep } from "@/src/middlewares/maintenanceGatekeep";
import { sessionSetup } from "@/src/middlewares/sessionSetup";

import type { BotContext } from "@/src/types/bot";

const token = process.env.BOT_TOKEN;
const mongoURL = process.env.MONGO_URL;
const creatorID = process.env.CREATOR_ID;

if (!token || !mongoURL) {
    console.error(ENVS_CHECK_FAIL);
    process.exit(1);
}

export const client = new MongoClient(mongoURL);
const bot = new Bot<BotContext>(token);
const i18n = new I18n<BotContext>({
    defaultLocale: "ru",
    directory: "locales",
    globalTranslationContext: (ctx) => ({
        botUsername: `@${ctx.me.username}`,
    }),
});
const botConfig = configSetup(creatorID);

bot.api.config.use(autoRetry());

bot.use(sequentialize(getSessionKey))
    .use(sessionSetup())
    .use(i18n)
    .use(botConfig)
    .use(maintenanceGatekeep)
    .use(inlineQueryHandler)
    .use(conversations())
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
    .use(voicesMenu)
    .use(voiceMenu)
    .use(voiceItemHandler)
    .use(invalidateCommand)
    .use(maintenanceCommand)
    .use(fullStatsCommand)
    .use(statsCommand)
    .use(newVoicesCommand)
    .use(newRemoteVoicesCommand)
    .use(voiceCommand)
    .use(voicesCommand);

bot.catch(catchHandler);

const runner = run(bot);

const stopRunner = async () => {
    await client.close();
    if (runner.isRunning()) {
        await runner.stop();
    }
    process.exit();
};

process.on("SIGINT", stopRunner);
process.on("SIGTERM", stopRunner);
process.on("uncaughtException", (error) => {
    if (error instanceof MongoError) {
        console.error("Something broken with Mongo:", error.message);
        process.exit(1);
    }

    console.error("Caught unhandled exception", { error });
});

try {
    // TODO: Remove after fix on Bun's side
    if (process.stdin.isTTY) {
        emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        process.stdin.on("keypress", (_, key) => {
            if (key.ctrl && key.name === "c") process.exit();
        });
    }

    await client.connect();
    await Promise.all([
        registerUserCommands(bot.api),
        registerCreatorCommands(bot.api, creatorID),
    ]);

    const botInfo = await bot.api.getMe();

    console.log(
        `Started as ${botInfo.first_name} (@${botInfo.username})\nRunning on Bun ${Bun.version}`,
    );
} catch (e) {
    console.log(e);
    await client.close();
}
