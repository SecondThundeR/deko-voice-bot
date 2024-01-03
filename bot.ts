import {
    Bot,
    dotenv,
    GrammyError,
    HttpError,
    I18n,
    MongoClient,
    run,
    RunnerHandle,
    session,
} from "@/deps.ts";

import { invalidateCommand } from "@/src/commands/pm/creator/invalidate.ts";
import { maintenanceCommand } from "@/src/commands/pm/creator/maintenance.ts";
import { favoritesCommand } from "@/src/commands/pm/favorites.ts";
import { myDataCommand } from "@/src/commands/pm/myData.ts";
import { optInCommand } from "@/src/commands/pm/optIn.ts";
import { optOutCommand } from "@/src/commands/pm/optOut.ts";
import { startCommand } from "@/src/commands/pm/start.ts";

import { ENVS_CHECK_FAIL } from "@/src/constants/locale.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";

import {
    registerCreatorCommands,
    registerUserCommands,
} from "@/src/helpers/api.ts";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery.ts";

import type { BotContext } from "@/src/types/bot.ts";

await dotenv({ export: true });

const token = Deno.env.get("BOT_TOKEN");
const mongoURL = Deno.env.get("MONGO_URL");
const creatorID = Deno.env.get("CREATOR_ID");

if (!token || !mongoURL) {
    console.error(ENVS_CHECK_FAIL);
    Deno.exit(1);
}

export const client = new MongoClient();
await client.connect(mongoURL);

const bot = new Bot<BotContext>(token);
const i18n = new I18n<BotContext>({
    defaultLocale: "ru",
    directory: "locales",
    globalTranslationContext(ctx) {
        return {
            botUsername: `@${ctx.me.username}`,
        };
    },
});
let runner: RunnerHandle | undefined;

bot.use(i18n);
bot.use(inlineQueryHandler);

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
const pmCreator = pm.filter((ctx) => ctx.from?.id == creatorID);

pm.use(session({
    initial() {
        return {
            currentOffset: 0,
        };
    },
}));
pm.use(favoritesMenu);

pm.use(startCommand);
pm.use(myDataCommand);
pm.use(optInCommand);
pm.use(optOutCommand);
pm.use(favoritesCommand);
pmCreator.use(invalidateCommand);
pmCreator.use(maintenanceCommand);

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

    console.error("Unknown error occurred:", error);
});

const stopRunner = () => runner?.isRunning() && runner.stop();

Deno.addSignalListener("SIGINT", stopRunner);
Deno.addSignalListener("SIGTERM", stopRunner);

try {
    runner = run(bot);

    await registerUserCommands(bot.api);
    await registerCreatorCommands(bot.api, creatorID);

    const botInfo = await bot.api.getMe();
    console.log(`Started as ${botInfo.first_name} (@${botInfo.username})`);
} catch (e) {
    console.log(e);
}
