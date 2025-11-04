import { sendDonationInvoice } from "@/src/helpers/api";

import type { BotContext, ConversationContext } from "@/src/types/bot";

export async function donateConversation(
    conversation: ConversationContext,
    ctx: BotContext,
) {
    await ctx.reply(ctx.t("donate.customAmountQuestion"));
    const amountCtx = await conversation.waitFor("message:text");
    const amount = parseInt(amountCtx.message.text, 10);

    if (isNaN(amount) || amount <= 0) {
        await ctx.reply(ctx.t("donate.incorrectCustomAmount"));
        return;
    }

    await conversation.external(() => sendDonationInvoice(ctx, amount));
}
