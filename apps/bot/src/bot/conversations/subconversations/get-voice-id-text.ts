import {
    isValidVoiceId,
    isVoiceIdUnique,
} from "@deko-voice-bot/database/queries/voices.js";
import type { Conversation } from "@grammyjs/conversations";
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

        if (!isValidVoiceId(text)) {
            await ctx.reply(long);
            continue;
        }
        const isIdUnique = await conversation.external(() =>
            isVoiceIdUnique(text),
        );
        if (!isIdUnique) {
            await ctx.reply(notUnique);
            continue;
        }
        return text;
    }
}
