import { GrammyError, HttpError, type BotError } from "grammy";
import { MongoError } from "mongodb";

import type { BotContext } from "@/src/types/bot";

export const catchHandler = (err: BotError<BotContext>) => {
    const { ctx, error } = err;

    console.error(
        `Error while handling update: ${JSON.stringify(ctx.update, null, 4)}`,
    );

    if (error instanceof GrammyError) {
        console.error("Error in request:", error.description);
        return;
    }

    if (error instanceof HttpError) {
        console.error("Could not contact Telegram:", error);
        return;
    }

    if (error instanceof MongoError) {
        console.error("Something broken with Mongo:", error.errmsg);
        return;
    }

    console.error("Unknown error occurred:", error);
};
