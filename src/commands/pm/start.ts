import { Composer, InlineKeyboard } from "@/deps.ts";

import { locale } from "@/src/constants/locale.ts";

const startCommand = new Composer();

const { startHelp, startButtonText } = locale.frontend;

const stickerForButtonDeeplink = Deno.env.get("STICKER_FILE_ID_FOR_DEEPLINK");

startCommand
    .filter((ctx) => ctx.chat?.type === "private")
    .command("start", async (ctx) => {
        if (ctx.match === "_") {
            return (
                stickerForButtonDeeplink !== undefined &&
                (await ctx.replyWithSticker(stickerForButtonDeeplink))
            );
        }

        return await ctx.reply(startHelp(ctx.me.username), {
            reply_markup: new InlineKeyboard().switchInline(startButtonText),
        });
    });

export { startCommand };
