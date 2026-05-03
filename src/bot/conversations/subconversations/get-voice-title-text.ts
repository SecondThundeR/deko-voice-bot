import type { Conversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "@/bot/context";

export async function getVoiceTitleTextSubconversation(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
    otherLocaleText = ctx.t("newvoices.titleHint"),
) {
    await ctx.reply(otherLocaleText);

    return conversation.form.text();
}
