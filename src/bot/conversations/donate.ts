import type { Conversation } from "@grammyjs/conversations";
import { createConversation } from "@grammyjs/conversations";
import type { Context, ConversationContext } from "#root/bot/context.js";
import {
    parseDonationAmount,
    sendDonationInvoice,
} from "#root/bot/helpers/api.js";

export const DONATE_CONVERSATION = "donate";

export function donateConversation() {
    return createConversation(
        async (
            conversation: Conversation<Context, ConversationContext>,
            ctx: ConversationContext,
        ) => {
            await ctx.reply(ctx.t("donate-custom-amount-question"));
            const amountCtx = await conversation.waitFor("message:text");
            const amount = parseDonationAmount(amountCtx.message.text);

            if (amount === null) {
                return ctx.reply(ctx.t("donate-custom-amount-invalid"));
            }

            return conversation.external(() =>
                sendDonationInvoice(ctx, amount),
            );
        },
        DONATE_CONVERSATION,
    );
}
