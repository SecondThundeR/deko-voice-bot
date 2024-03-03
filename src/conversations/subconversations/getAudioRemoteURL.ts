import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

export async function getAudioRemoteURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newremotevoices.URLHint"), { parse_mode: "HTML" });

    const url = await conversation.form.url((ctx) =>
        ctx.reply(ctx.t("newremotevoices.URLInvalid"))
    );

    return url.toString();
}
