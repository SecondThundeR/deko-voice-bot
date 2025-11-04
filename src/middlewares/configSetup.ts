import type { NextFunction } from "grammy";

import type { BotContext } from "@/src/types/bot";

export function configSetup(adminIds: string) {
    return async (ctx: BotContext, next: NextFunction) => {
        const adminIdsSplit = adminIds.split(" ").map(Number);

        ctx.config = {
            adminIDs: adminIdsSplit,
            isAdmin: ctx.from?.id ? adminIdsSplit.includes(ctx.from.id) : false,
        };

        await next();
    };
}
