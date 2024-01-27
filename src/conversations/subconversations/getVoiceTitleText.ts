import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function getVoiceTitleText(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newvoice.titleHint"));
    return await conversation.form.text();
}
