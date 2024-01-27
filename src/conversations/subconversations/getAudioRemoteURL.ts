import type { BotContext, ConversationContext } from "@/src/types/bot.ts";
import { isValidURL } from "@/src/helpers/general.ts";

export async function getAudioRemoteURL(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("newremotevoice.URLHint"), { parse_mode: "HTML" });

    do {
        ctx = await conversation.wait();
        const messageText = ctx.message?.text;

        if (!messageText) {
            continue;
        } else if (isValidURL(messageText)) {
            return messageText;
        }

        await ctx.reply(ctx.t("newremotevoice.URLInvalid"));
    } while (!ctx.message?.text);
}
