import { isBotBlockedByUser } from "@/src/helpers/api.ts";

import type { BotContext } from "@/src/types/bot.ts";

export async function menuBanCheck(
    ctx: BotContext,
    next: () => Promise<void>,
) {
    const isReplyMarkupPassed = !!ctx.msg?.reply_markup;
    const isBannedByUser = await isBotBlockedByUser(ctx);
    const isInlineButtonsUpdateFailed = isReplyMarkupPassed && isBannedByUser;

    if (isInlineButtonsUpdateFailed) {
        return void await ctx.answerCallbackQuery(ctx.t("inline.blocked"));
    }

    await next();
}
