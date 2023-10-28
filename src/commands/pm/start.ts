import { Composer } from "@/deps.ts";

import { featureFlags } from "@/src/constants/database.ts";
import { locale } from "@/src/constants/locale.ts";
import { sendInlineRequestKeyboard } from "@/src/constants/keyboards.ts";

const startCommand = new Composer();

const { startHelp, maintenance: { description } } = locale.frontend;

const stickerForButtonDeeplink = Deno.env.get("STICKER_FILE_ID_FOR_DEEPLINK");

startCommand.command("start", async (ctx) => {
    if (ctx.match === "_") {
        return (
            stickerForButtonDeeplink !== undefined &&
            (await ctx.replyWithSticker(stickerForButtonDeeplink))
        );
    }

    if (ctx.match === featureFlags.maintenance) {
        return await ctx.reply(description);
    }

    return await ctx.reply(startHelp(ctx.me.username), {
        reply_markup: sendInlineRequestKeyboard,
    });
});

export { startCommand };