import { Composer } from "grammy";
import {
    insertPayment,
    markPaymentAsRefunded,
} from "#drizzle/queries/payments.js";
import { donateData } from "#root/bot/callback-data/donate.js";
import type { Context } from "#root/bot/context.js";
import { DONATE_CONVERSATION } from "#root/bot/conversations/donate.js";
import {
    parseDonationAmount,
    sendDonationInvoice,
} from "#root/bot/helpers/api.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { createDonateKeyboard } from "#root/bot/keyboards/donate.js";
import { getSafeErrorInfo } from "#root/logging.js";

const LEGACY_DONATE_AMOUNT_REGEX = /^donate_(\d+)$/;

const composer = new Composer<Context>();

const feature = composer.chatType("private");

async function prepareDonation(ctx: Context) {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage().catch(() => {});
}

async function handleCustomDonation(ctx: Context) {
    await prepareDonation(ctx);
    return ctx.conversation.enter(DONATE_CONVERSATION);
}

async function handleRegularDonation(ctx: Context, amountValue: string) {
    await prepareDonation(ctx);

    const amount = parseDonationAmount(amountValue);
    if (amount === null) {
        return ctx.reply(ctx.t("donate-custom-amount-invalid"));
    }
    return sendDonationInvoice(ctx, amount);
}

feature.command("donate", logHandle("command-donate"), (ctx) =>
    ctx.reply(ctx.t("donate-message"), {
        reply_markup: createDonateKeyboard(ctx),
    }),
);

feature.callbackQuery(
    donateData.filter({
        amount: "custom",
    }),
    logHandle("keyboard-donate-custom"),
    handleCustomDonation,
);

feature.callbackQuery(
    "donate_custom",
    logHandle("keyboard-donate-custom-legacy"),
    handleCustomDonation,
);

feature.callbackQuery(
    donateData.filter(),
    logHandle("keyboard-donate-regular"),
    (ctx) => handleRegularDonation(ctx, ctx.match[1]),
);

feature.callbackQuery(
    LEGACY_DONATE_AMOUNT_REGEX,
    logHandle("keyboard-donate-regular-legacy"),
    (ctx) => handleRegularDonation(ctx, ctx.match[1]),
);

composer.on(
    "pre_checkout_query",
    logHandle("donate-pre-checkout-query"),
    (ctx) => ctx.preCheckoutQuery.answer(true),
);

composer.on(
    "message:refunded_payment",
    logHandle("donate-refunded-payment"),
    async (ctx) => {
        const payment = ctx.message.refunded_payment;
        const isPaymentMarkedAsRefunded = await markPaymentAsRefunded(
            payment.telegram_payment_charge_id,
        );

        if (!isPaymentMarkedAsRefunded) {
            ctx.logger.warn({
                msg: "Received a refund confirmation for an unknown payment",
            });
            return;
        }

        ctx.logger.info({ msg: "Refund reconciled from Telegram update" });
    },
);

feature.on(
    "message:successful_payment",
    logHandle("donate-successful-payment"),
    async (ctx) => {
        const payment = ctx.message.successful_payment;

        try {
            await insertPayment({
                chargeId: payment.telegram_payment_charge_id,
                invoicePayload: payment.invoice_payload,
                userId: ctx.from.id,
                amount: payment.total_amount,
            });
        } catch (error: unknown) {
            ctx.logger.error({
                msg: "Failed to store payment in database",
                ...getSafeErrorInfo(error),
            });
            throw error;
        }

        ctx.logger.info({ msg: "Payment recorded" });

        const amount = payment.total_amount;
        return ctx.reply(ctx.t("donate-success", { amount }));
    },
);

export { composer as donateFeature };
