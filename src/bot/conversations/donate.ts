import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "../context";
import { sendDonationInvoice } from "../helpers/api";

export const DONATE_CONVERSATION = "donate";

export function donateConversation() {
    return createConversation(
        async (
            conversation: Conversation<Context, ConversationContext>,
            ctx: ConversationContext,
        ) => {
            await ctx.reply(ctx.t("donate.customAmountQuestion"));
            const amountCtx = await conversation.waitFor("message:text");
            const amount = parseInt(amountCtx.message.text, 10);

            if (Number.isNaN(amount) || amount <= 0) {
                return ctx.reply(ctx.t("donate.incorrectCustomAmount"));
            }

            return conversation.external(() =>
                sendDonationInvoice(ctx, amount),
            );
        },
        DONATE_CONVERSATION,
    );
}
