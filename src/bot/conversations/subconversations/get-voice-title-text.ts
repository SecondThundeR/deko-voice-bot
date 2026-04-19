import type { Conversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "../../context";

export async function getVoiceTitleTextSubconversation(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
    otherLocaleText = ctx.t("newvoices.titleHint"),
) {
    await ctx.reply(otherLocaleText);

    return await conversation.form.text();
}
