import { isNotUniqueVoiceID } from "@/src/helpers/cache";

import type { BotContext, ConversationContext } from "@/src/types/bot";

type LocaleStrings = {
    hint: string;
    notUnique: string;
    long: string;
};

const VOICE_ID_LENGTH = 64;

export async function getVoiceIDText(
    conversation: ConversationContext,
    ctx: BotContext,
    otherLocale?: LocaleStrings,
) {
    let text: string | undefined;
    const {
        hint = ctx.t("newvoices.idHint"),
        notUnique = ctx.t("newvoices.idNotUnique"),
        long = ctx.t("newvoices.idLong"),
    } = { ...otherLocale };

    await ctx.reply(hint, { parse_mode: "HTML" });

    do {
        text = await conversation.form.text();

        if (isNotUniqueVoiceID(text)) {
            await ctx.reply(notUnique);
            continue;
        }
        if (text.length > VOICE_ID_LENGTH) {
            await ctx.reply(long);
            continue;
        }

        return text;
    } while (true);
}
