import type { Conversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "#root/bot/context.js";

export async function getVoiceTitleTextSubconversation(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
    otherLocaleText = ctx.t("new-voices-title-hint"),
) {
    await ctx.reply(otherLocaleText);

    return conversation.form.text();
}
