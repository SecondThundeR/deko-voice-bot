import {
    apiThrottler,
    autoRetry,
    Bot,
    conversations,
    createConversation,
    dotenv,
    GrammyError,
    HttpError,
    I18n,
    MongoClient,
    MongoError,
    type RawApi,
    run,
    sequentialize,
    type Transformer,
} from "@/deps.ts";

await dotenv({ export: true });

import { fullStatsCommand } from "@/src/commands/pm/creator/fullStats.ts";
import { invalidateCommand } from "@/src/commands/pm/creator/invalidate.ts";
import { maintenanceCommand } from "@/src/commands/pm/creator/maintenance.ts";
import { newRemoteVoiceCommand } from "@/src/commands/pm/creator/newRemoteVoice.ts";
import { newVoiceCommand } from "@/src/commands/pm/creator/newVoice.ts";
import { statsCommand } from "@/src/commands/pm/creator/stats.ts";
import { voicesCommand } from "@/src/commands/pm/creator/voices.ts";
import { favoritesCommand } from "@/src/commands/pm/favorites.ts";
import { myDataCommand } from "@/src/commands/pm/myData.ts";
import { optInCommand } from "@/src/commands/pm/optIn.ts";
import { optOutCommand } from "@/src/commands/pm/optOut.ts";
import { startCommand } from "@/src/commands/pm/start.ts";

import { ENVS_CHECK_FAIL } from "@/src/constants/locale.ts";

import { newRemoteVoice } from "@/src/conversations/newRemoteVoice.ts";
import { newVoice } from "@/src/conversations/newVoice.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";
import { voicesMenu } from "@/src/menu/voices.ts";

import {
    getSessionKey,
    registerCreatorCommands,
    registerUserCommands,
} from "@/src/helpers/api.ts";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery.ts";

import { configSetup } from "@/src/middlewares/configSetup.ts";
import { maintenanceGatekeep } from "@/src/middlewares/maintenanceGatekeep.ts";
import { sessionSetup } from "@/src/middlewares/sessionSetup.ts";

import type { BotContext } from "@/src/types/bot.ts";

const token = Deno.env.get("BOT_TOKEN");
const mongoURL = Deno.env.get("MONGO_URL");
const creatorID = Deno.env.get("CREATOR_ID");

if (!token || !mongoURL) {
    console.error(ENVS_CHECK_FAIL);
    Deno.exit(1);
}

export const client = new MongoClient(mongoURL);
await client.connect();

const bot = new Bot<BotContext>(token);
// @ts-expect-error
const i18n = new I18n<BotContext>({
    globalTranslationContext: (ctx) => ({
        botUsername: `@${ctx.me.username}`,
    }),
});

await i18n.loadLocale("ru", { filePath: "locales/ru.ftl" });
const botConfig = configSetup(creatorID);

const throttler = apiThrottler() as Transformer<RawApi>;
bot.api.config
    .use(throttler)
    .use(autoRetry());

bot
    .use(sequentialize(getSessionKey))
    .use(sessionSetup())
    .use(i18n)
    .use(botConfig)
    .use(maintenanceGatekeep)
    .use(inlineQueryHandler)
    // @ts-expect-error Types, bruh
    .use(conversations());

bot.command("cancel", async (ctx) => await ctx.conversation.exit());
bot
    // @ts-expect-error Types, bruh
    .use(createConversation(newVoice, "new-voice"))
    .use(
        // @ts-expect-error Types, bruh
        createConversation(newRemoteVoice, "new-remote-voice"),
    );

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
const pmCreator = pm.filter((ctx) => !!ctx.config?.isCreator);

pm
    .use(favoritesMenu)
    .use(startCommand)
    .use(myDataCommand)
    .use(optInCommand)
    .use(optOutCommand)
    .use(favoritesCommand);

pmCreator
    .use(voicesMenu)
    .use(invalidateCommand)
    .use(maintenanceCommand)
    .use(fullStatsCommand)
    .use(statsCommand)
    .use(newVoiceCommand)
    .use(newRemoteVoiceCommand)
    .use(voicesCommand);

bot.catch((err) => {
    const { ctx, error } = err;

    console.error(
        `Error while handling update: ${JSON.stringify(ctx.update, null, 4)}`,
    );

    if (error instanceof GrammyError) {
        return console.error("Error in request:", error.description);
    }

    if (error instanceof HttpError) {
        return console.error("Could not contact Telegram:", error);
    }

    if (error instanceof MongoError) {
        return console.error("Something broken with Mongo:", error);
    }

    console.error("Unknown error occurred:", error);
});

const runner = run(bot);

const stopRunner = () => {
    runner.isRunning() && runner.stop();
    Deno.exit();
};

Deno.addSignalListener("SIGINT", stopRunner);
Deno.addSignalListener("SIGTERM", stopRunner);

try {
    await Promise.all([
        registerUserCommands(bot.api),
        registerCreatorCommands(bot.api, creatorID),
    ]);

    const botInfo = await bot.api.getMe();
    const { deno, typescript, v8 } = Deno.version;
    console.log(
        `Started as ${botInfo.first_name} (@${botInfo.username})\nRunning on Deno ${deno} (TS: ${typescript}; V8: ${v8})`,
    );
} catch (e) {
    console.log(e);
}
