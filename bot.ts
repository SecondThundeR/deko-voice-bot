import {
    Bot,
    dotenv,
    GrammyError,
    HttpError,
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

import { locale } from "@/src/constants/locale.ts";

import { favoritesMenu } from "@/src/menu/favorites.ts";

import {
    registerCreatorCommands,
    registerUserCommands,
} from "@/src/helpers/api.ts";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery.ts";

import type { BotContext } from "@/src/types/bot.ts";

await dotenv({ export: true });

const { envsCheckFail } = locale.general;

const token = Deno.env.get("BOT_TOKEN");
const mongoURL = Deno.env.get("MONGO_URL");
const creatorID = Deno.env.get("CREATOR_ID");

if (!token || !mongoURL) {
    console.error(envsCheckFail);
    Deno.exit(1);
}

export const client = new MongoClient();
await client.connect(mongoURL);

const bot = new Bot<BotContext>(token);
let runner: RunnerHandle | undefined;

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
const pmCreator = pm.filter((ctx) => ctx.from?.id == creatorID);

bot.use(inlineQueryHandler);
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
