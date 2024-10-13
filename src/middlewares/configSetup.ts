import type { NextFunction } from "grammy";

import type { BotContext } from "@/src/types/bot";

export function configSetup(creatorID = "") {
    return async (ctx: BotContext, next: NextFunction) => {
        ctx.config = {
            stickerFileID: process.env.STICKER_FILE_ID_FOR_DEEPLINK,
            creatorID: +creatorID,
            isCreator: ctx.from?.id === +creatorID,
        };

        await next();
    };
}
