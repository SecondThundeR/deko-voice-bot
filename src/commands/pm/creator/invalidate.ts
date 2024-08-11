import { Composer } from "grammy";

import { invalidateVoiceCaches } from "@/src/helpers/cache";

import type { BotContext } from "@/src/types/bot";

export const invalidateCommand = new Composer<BotContext>();

invalidateCommand.command("invalidate", async (ctx) => {
    if (ctx.config.isCachingDisabled) {
        await ctx.reply(ctx.t("invalidate.disabled"));
        return;
    }
    invalidateVoiceCaches();

    await ctx.reply(ctx.t("invalidate.success"));
});
