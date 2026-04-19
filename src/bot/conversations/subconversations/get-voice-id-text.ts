import type { Conversation } from "@grammyjs/conversations";
import { VOICE_ID_LENGTH } from "@/drizzle/constraints";
import { isVoiceIdUnique } from "@/drizzle/queries/select";
import type { Context, ConversationContext } from "../../context";

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
        hint = ctx.t("newvoices.idHint"),
        notUnique = ctx.t("newvoices.idNotUnique"),
        long = ctx.t("newvoices.idLong"),
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
