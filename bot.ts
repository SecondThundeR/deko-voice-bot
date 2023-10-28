// @deno-types="npm:@types/node"
import process from "node:process";

import {
    Bot,
    dotenv,
    GrammyError,
    HttpError,
    MongoClient,
    run,
    RunnerHandle,
} from "@/deps.ts";

import { startCommand } from "@/src/commands/pm/start.ts";
import { myDataCommand } from "@/src/commands/pm/myData.ts";
import { invalidateCommand } from "@/src/commands/pm/creator/invalidate.ts";
import { maintenanceCommand } from "@/src/commands/pm/creator/maintenance.ts";
import { locale } from "@/src/constants/locale.ts";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery.ts";
import { registerCreatorCommands } from "@/src/helpers/api.ts";

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

const bot = new Bot(token);
const botInfo = await bot.api.getMe();
let runner: RunnerHandle | undefined;

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
const pmCreator = pm.filter((ctx) => ctx.from?.id == creatorID);

pm.use(startCommand);
pm.use(myDataCommand);
pmCreator.use(invalidateCommand);
pmCreator.use(maintenanceCommand);
bot.use(inlineQueryHandler);

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

const stopOnTerm = async () => {
    if (runner?.isRunning()) {
        await runner.stop();
        return true;
    }
    return false;
};

process.once("SIGINT", stopOnTerm);
process.once("SIGTERM", stopOnTerm);

try {
    runner = run(bot);
    await registerCreatorCommands(bot.api, creatorID);
    console.log(`Started as ${botInfo.first_name} (@${botInfo.username})`);
} catch (e) {
    console.log(e);
}
