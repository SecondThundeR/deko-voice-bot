import { isCachingDisabled } from "@/src/helpers/cache";

import type { BotContext } from "@/src/types/bot";

const BASE_CONFIG = {
    isCachingDisabled: isCachingDisabled(),
};

export function configSetup(creatorID?: string) {
    return async (ctx: BotContext, next: () => Promise<void>) => {
        const convertedID = Number(creatorID);

        if (isNaN(convertedID)) {
            ctx.config = {
                ...BASE_CONFIG,
                isCreator: false,
            };
        } else {
            ctx.config = {
                ...BASE_CONFIG,
                creatorID: convertedID,
                isCreator: ctx.from?.id === convertedID,
            };
        }

        await next();
    };
}
