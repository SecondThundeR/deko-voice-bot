import { isNotUniqueVoiceID } from "@/src/helpers/cache.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function getVoiceIDText(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newvoice.idHint"), { parse_mode: "HTML" });

    do {
        ctx = await conversation.wait();
        const messageText = ctx.message?.text;

        if (!messageText) {
            continue;
        } else if (isNotUniqueVoiceID(messageText)) {
            await ctx.reply(ctx.t("newvoice.idNotUnique"));
        } else if (messageText.length <= 64) {
            return messageText;
        } else {
            await ctx.reply(ctx.t("newvoice.idLong"));
        }
    } while (!ctx.message?.text);
}