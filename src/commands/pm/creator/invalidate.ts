import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";

import { invalidateRootCache } from "@/src/helpers/cache.ts";

const { invalidatedSuccessfully } = locale.frontend;

export const invalidateCommand = new Composer();

invalidateCommand.command("invalidate", async (ctx) => {
    invalidateRootCache();
    await ctx.reply(invalidatedSuccessfully);
});
