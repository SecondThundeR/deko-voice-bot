import {
    apiThrottler,
    autoRetry,
    Bot,
    conversations,
    createConversation,
    dotenv,
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
import { newRemoteVoicesCommand } from "@/src/commands/pm/creator/newRemoteVoices.ts";
import { newVoicesCommand } from "@/src/commands/pm/creator/newVoices.ts";
import { statsCommand } from "@/src/commands/pm/creator/stats.ts";
import { voiceCommand } from "@/src/commands/pm/creator/voice.ts";
import { voicesCommand } from "@/src/commands/pm/creator/voices.ts";
import { favoritesCommand } from "@/src/commands/pm/favorites.ts";
import { myDataCommand } from "@/src/commands/pm/myData.ts";
import { optInCommand } from "@/src/commands/pm/optIn.ts";
import { optOutCommand } from "@/src/commands/pm/optOut.ts";
import { startCommand } from "@/src/commands/pm/start.ts";
import { cancelCommand } from "@/src/commands/cancel.ts";

import { ENVS_CHECK_FAIL } from "@/src/constants/locale.ts";

import { newRemoteVoices } from "@/src/conversations/newRemoteVoices.ts";
import { newVoices } from "@/src/conversations/newVoices.ts";
import { updateVoiceFile } from "@/src/conversations/updateVoiceFile.ts";
import { updateVoiceID } from "@/src/conversations/updateVoiceID.ts";
import { updateVoiceTitle } from "@/src/conversations/updateVoiceTitle.ts";
import { updateVoiceURL } from "@/src/conversations/updateVoiceURL.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";
import { voiceMenu } from "@/src/menu/voice.ts";
import { voicesMenu } from "@/src/menu/voices.ts";

import {
    getSessionKey,
    registerCreatorCommands,
    registerUserCommands,
} from "@/src/helpers/api.ts";

import { catchHandler } from "@/src/handlers/catch.ts";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery.ts";
import { voiceItemHandler } from "@/src/handlers/voiceItem.ts";

import { configSetup } from "@/src/middlewares/configSetup.ts";
import { maintenanceGatekeep } from "@/src/middlewares/maintenanceGatekeep.ts";
import { sessionSetup } from "@/src/middlewares/sessionSetup.ts";

import type { BotContext } from "@/src/types/bot.ts";

const token = Deno.env.get("BOT_TOKEN");
const mongoURL = Deno.env.get("MONGO_URL");
const creatorID = Deno.env.get("CREATOR_ID");

if (!token || !mongoURL) {
    console.error(ENVS_CHECK_FAIL);
    Deno.exit();
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
    .use(conversations())
    // @ts-expect-error Types, bruh
    .use(createConversation(newVoices, "new-voices"))
    .use(
        // @ts-expect-error Types, bruh
        createConversation(newRemoteVoices, "new-remote-voices"),
    )
    .use(
        // @ts-expect-error Types, bruh
        createConversation(updateVoiceID, "voice-id-update"),
    )
    .use(
        // @ts-expect-error Types, bruh
        createConversation(updateVoiceTitle, "voice-title-update"),
    )
    .use(
        // @ts-expect-error Types, bruh
        createConversation(updateVoiceFile, "voice-file-update"),
    )
    .use(
        // @ts-expect-error Types, bruh
        createConversation(updateVoiceURL, "voice-url-update"),
    )
    .use(cancelCommand);

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

const stopRunner = () => {
    runner.isRunning() && runner.stop();
    Deno.exit();
};

Deno.addSignalListener("SIGINT", stopRunner);
Deno.addSignalListener("SIGTERM", stopRunner);

addEventListener("error", (event) => {
    const errorObject = event.error;
    if (errorObject instanceof MongoError) {
        console.error("Something broken with Mongo:", errorObject.errmsg);
        Deno.exit();
    }

    console.log("Caught unhandled event:", event.message);
    event.preventDefault();
});

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
