import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function getVoiceTitleText(
    conversation: ConversationContext,
    ctx: BotContext,
    otherLocaleText?: string,
) {
    await ctx.reply(otherLocaleText ?? ctx.t("newvoices.titleHint"));

    do {
        ctx = await conversation.waitFor("message:text");
        const messageText = ctx.msg?.text;

        if (!messageText) {
            continue;
        }

        return messageText;
    } while (!ctx.msg?.text);
}
