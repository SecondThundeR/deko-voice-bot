import { Composer } from "grammy";

import { insertPaymentQuery } from "@/drizzle/prepared/payments";

import { sendDonationInvoice } from "@/src/helpers/api";

import type { BotContext } from "@/src/types/bot";

export const donateQueryHandler = new Composer<BotContext>();

donateQueryHandler.callbackQuery(/donate_(\d+)/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const amount = parseInt(ctx.match[1], 10);
    await sendDonationInvoice(ctx, amount);
});

donateQueryHandler.callbackQuery("donate_custom", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter("donate");
});

donateQueryHandler.on("pre_checkout_query", (ctx) =>
    ctx.answerPreCheckoutQuery(true),
);

donateQueryHandler.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;

    const amount = payment.total_amount;
    await ctx.reply(ctx.t("donate.success", { amount: String(amount) }));

    try {
        await insertPaymentQuery.execute({
            chargeId: payment.telegram_payment_charge_id,
            invoicePayload: payment.invoice_payload,
            userId: ctx.from.id,
            amount: payment.total_amount,
        });
    } catch (error: unknown) {
        console.error("Failed to store payment payload in database", error);
    }
});
