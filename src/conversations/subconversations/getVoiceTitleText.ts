import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function getVoiceTitleText(
    conversation: ConversationContext,
    ctx: BotContext,
    otherLocaleText = ctx.t("newvoices.titleHint"),
) {
    await ctx.reply(otherLocaleText);

    return await conversation.form.text();
}
