import type { BotContext } from "@/src/types/bot.ts";

export function configSetup(creatorID?: string) {
    return async function (ctx: BotContext, next: () => Promise<void>) {
        if (!creatorID) {
            return void await next();
        }

        const convertedID = Number(creatorID);
        ctx.config = {
            creatorID: convertedID,
            isCreator: ctx.from?.id === convertedID,
        };

        await next();
    };
}
