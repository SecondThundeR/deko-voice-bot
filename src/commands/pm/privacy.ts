import { Composer } from "grammy";

import { PRIVACY_MESSAGE_TEXT } from "@/src/constants/general";

import type { BotContext } from "@/src/types/bot";

export const privacyCommand = new Composer<BotContext>();

privacyCommand.command("privacy", async (ctx) => {
    await ctx.reply(PRIVACY_MESSAGE_TEXT, {
        parse_mode: "MarkdownV2",
    });
});
