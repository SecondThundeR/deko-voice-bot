import type { BotContext } from "@/src/types/bot.ts";

export function configSetup(creatorID?: string) {
    return async (ctx: BotContext, next: () => Promise<void>) => {
        if (!creatorID) {
            await next();
            return;
        }

        const convertedID = Number(creatorID);
        ctx.config = {
            creatorID: convertedID,
            isCreator: ctx.from?.id === convertedID,
        };

        await next();
    };
}
