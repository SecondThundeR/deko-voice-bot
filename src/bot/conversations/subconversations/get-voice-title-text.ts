import type { Conversation } from "@grammyjs/conversations";
import { VOICE_TITLE_LENGTH } from "#drizzle/constraints.js";
import type { Context, ConversationContext } from "#root/bot/context.js";

export async function getVoiceTitleTextSubconversation(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
    otherLocaleText = ctx.t("new-voices-title-hint"),
) {
    await ctx.reply(otherLocaleText);

    while (true) {
        const text = await conversation.form.text();

        if (text.length > VOICE_TITLE_LENGTH) {
            await ctx.reply(
                ctx.t("new-voices-title-too-long", {
                    maxLength: VOICE_TITLE_LENGTH,
                }),
            );
            continue;
        }

        return text;
    }
}
