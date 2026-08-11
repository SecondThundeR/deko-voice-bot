import type { Conversation } from "@grammyjs/conversations";
import { VOICE_ID_LENGTH } from "#drizzle/constraints.js";
import { isVoiceIdUnique } from "#drizzle/queries/voices.js";
import type { Context, ConversationContext } from "#root/bot/context.js";

export async function getVoiceIDTextSubconversation(
    conversation: Conversation<Context, ConversationContext>,
    ctx: ConversationContext,
    otherLocale?: {
        hint: string;
        notUnique: string;
        long: string;
    },
) {
    const {
        hint = ctx.t("new-voices-id-hint"),
        notUnique = ctx.t("new-voices-id-not-unique"),
        long = ctx.t("new-voices-id-too-long"),
    } = { ...otherLocale };

    await ctx.reply(hint, { parse_mode: "HTML" });

    while (true) {
        const text = await conversation.form.text();

        const isIdUnique = await conversation.external(() =>
            isVoiceIdUnique(text),
        );
        if (!isIdUnique) {
            await ctx.reply(notUnique);
            continue;
        }
        if (text.length > VOICE_ID_LENGTH) {
            await ctx.reply(long);
            continue;
        }

        return text;
    }
}
