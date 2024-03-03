import { isNotUniqueVoiceID } from "@/src/helpers/cache.ts";

import type { BotContext, ConversationContext } from "@/src/types/bot.ts";

type LocaleStrings = {
    hint: string;
    notUnique: string;
    long: string;
};

export async function getVoiceIDText(
    conversation: ConversationContext,
    ctx: BotContext,
    otherLocale?: LocaleStrings,
) {
    const { hint, notUnique, long } = otherLocale ?? {};

    await ctx.reply(hint ?? ctx.t("newvoices.idHint"), { parse_mode: "HTML" });

    do {
        ctx = await conversation.waitFor("message:text");
        const messageText = ctx.msg?.text;

        if (!messageText) {
            continue;
        } else if (isNotUniqueVoiceID(messageText)) {
            await ctx.reply(notUnique ?? ctx.t("newvoices.idNotUnique"));
        } else if (messageText.length <= 64) {
            return messageText;
        } else {
            await ctx.reply(long ?? ctx.t("newvoices.idLong"));
        }
    } while (!ctx.msg?.text);
}
