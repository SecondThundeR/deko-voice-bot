import { BotError, GrammyError, HttpError, MongoError } from "@/deps.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const catchHandler = (err: BotError<BotContext>) => {
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
        return console.error("Something broken with Mongo:", error.errmsg);
    }

    console.error("Unknown error occurred:", error);
};
