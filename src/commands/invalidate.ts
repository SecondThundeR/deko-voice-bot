import { Composer } from "@/deps.ts";

import { invalidateRootCache } from "@/src/helpers/cache.ts";

import { locale } from "@/src/constants.ts";

const invalidateCommand = new Composer();

const { invalidatedSuccessfully } = locale.frontend;

invalidateCommand
  .filter((ctx) => ctx.chat?.type === "private")
  .command("invalidate", async (ctx) => {
    const creatorID = Deno.env.get("CREATOR_ID");
    if (!creatorID || ctx.update.message?.from?.id !== Number(creatorID))
      return;

    invalidateRootCache();
    return await ctx.reply(invalidatedSuccessfully);
  });

export { invalidateCommand };
