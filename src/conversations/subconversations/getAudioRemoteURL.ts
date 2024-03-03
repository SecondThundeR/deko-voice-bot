import { isValidURL } from "@/src/helpers/general.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function getAudioRemoteURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newremotevoices.URLHint"), { parse_mode: "HTML" });

    do {
        ctx = await conversation.waitFor("message:text");
        const messageText = ctx.msg?.text;

        if (!messageText) {
            continue;
        } else if (isValidURL(messageText)) {
            return messageText;
        }

        await ctx.reply(ctx.t("newremotevoices.URLInvalid"));
    } while (!ctx.msg?.text);
}
