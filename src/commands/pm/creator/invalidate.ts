import { Composer } from "@/deps.ts";

import { invalidateRootCache } from "@/src/helpers/cache.ts";

import type { BotContext } from "@/src/types/bot.ts";

export const invalidateCommand = new Composer<BotContext>();

invalidateCommand.command("invalidate", async (ctx) => {
    invalidateRootCache();
    await ctx.reply(ctx.t("invalidate.success"));
});
