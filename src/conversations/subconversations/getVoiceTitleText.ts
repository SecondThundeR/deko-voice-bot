import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function getVoiceTitleText(
    conversation: ConversationContext,
    ctx: BotContext,
    otherLocaleText?: string,
) {
    await ctx.reply(otherLocaleText ?? ctx.t("newvoice.titleHint"));

    do {
        ctx = await conversation.wait();
        const messageText = ctx.message?.text;

        if (!messageText) {
            continue;
        }

        return messageText;
    } while (!ctx.message?.text);
}
