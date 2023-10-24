import { Composer } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";
import { invalidateRootCache } from "@/src/helpers/cache.ts";

const invalidateCommand = new Composer();

const { invalidatedSuccessfully } = locale.frontend;

invalidateCommand.command("invalidate", async (ctx) => {
    invalidateRootCache();
    return await ctx.reply(invalidatedSuccessfully);
});

export { invalidateCommand };
