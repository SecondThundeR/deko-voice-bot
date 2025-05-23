import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function getAudioRemoteURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newremotevoices.URLHint"), { parse_mode: "HTML" });

    const url = await conversation.form.entity("url");

    return url.toString();
}
