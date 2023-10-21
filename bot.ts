// @deno-types="npm:@types/node"
import process from "node:process";

import {
  Bot,
  GrammyError,
  HttpError,
  MongoClient,
  RunnerHandle,
  dotenv,
  run,
} from "@/deps.ts";

import { invalidateCommand } from "@/src/commands/invalidate.ts";
import { startCommand } from "@/src/commands/start.ts";
import { inlineQueryHandler } from "@/src/handlers/inlineQuery.ts";
import { registerCreatorCommands } from "@/src/helpers/api.ts";

import { locale } from "@/src/constants.ts";

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

bot.use(startCommand);
bot.use(invalidateCommand);
bot.use(inlineQueryHandler);

bot.catch((err) => {
  const { ctx, error } = err;

  console.error(
    `Error while handling update: ${JSON.stringify(ctx.update, null, 4)}`
  );

  if (error instanceof GrammyError) {
    console.error("Error in request:", error.description);
    return;
  }

  if (error instanceof HttpError) {
    console.error("Could not contact Telegram:", error);
    return;
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
