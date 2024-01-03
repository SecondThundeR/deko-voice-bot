import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { locale } from "@/src/constants/locale.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

const { startHelp, maintenance: { description } } = locale.frontend;
const STICKER_FOR_DEEPLINK = Deno.env.get("STICKER_FILE_ID_FOR_DEEPLINK");

export const startCommand = new Composer();

startCommand.command("start", async (ctx) => {
    if (ctx.match === "_" && STICKER_FOR_DEEPLINK) {
        return await ctx.replyWithSticker(STICKER_FOR_DEEPLINK);
    }

    if (ctx.match === featureFlags.maintenance) {
        return await ctx.reply(description);
    }

    await ctx.reply(startHelp(ctx.me.username), {
        reply_markup: sendInlineRequestKeyboard,
    });
});
