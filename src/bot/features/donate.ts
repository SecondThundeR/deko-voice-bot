import { insertPaymentQuery } from "drizzle/prepared/payments";
import { Composer } from "grammy";
import { donateData } from "@/bot/callback-data/donate";
import type { Context } from "@/bot/context";
import { DONATE_CONVERSATION } from "@/bot/conversations/donate";
import { sendDonationInvoice } from "@/bot/helpers/api";
import { getUpdateInfo, logHandle } from "@/bot/helpers/logging";
import { createDonateKeyboard } from "@/bot/keyboards/donate";

const LEGACY_DONATE_AMOUNT_REGEX = /^donate_(\d+)$/;

const composer = new Composer<Context>();

const feature = composer.chatType("private");

feature.command("donate", logHandle("command-donate"), (ctx) =>
    ctx.reply(ctx.t("donate.commandText"), {
        reply_markup: createDonateKeyboard(ctx),
    }),
);

feature.callbackQuery(
    donateData.filter({
        amount: "custom",
    }),
    logHandle("keyboard-donate-custom"),
    async (ctx) => {
        await ctx.callbackQuery.answer();
        await ctx.deleteMessage();

        return ctx.conversation.enter(DONATE_CONVERSATION);
    },
);

feature.callbackQuery(
    "donate_custom",
    logHandle("keyboard-donate-custom-legacy"),
    async (ctx) => {
        await ctx.callbackQuery.answer();
        await ctx.deleteMessage();

        return ctx.conversation.enter(DONATE_CONVERSATION);
    },
);

feature.callbackQuery(
    donateData.filter(),
    logHandle("keyboard-donate-regular"),
    async (ctx) => {
        await ctx.callbackQuery.answer();
        await ctx.deleteMessage();

        const amount = parseInt(ctx.match[1], 10);
        return sendDonationInvoice(ctx, amount);
    },
);

feature.callbackQuery(
    LEGACY_DONATE_AMOUNT_REGEX,
    logHandle("keyboard-donate-regular-legacy"),
    async (ctx) => {
        await ctx.callbackQuery.answer();
        await ctx.deleteMessage();

        const amount = parseInt(ctx.match[1], 10);
        return sendDonationInvoice(ctx, amount);
    },
);

composer.on(
    "pre_checkout_query",
    logHandle("donate-pre-checkout-query"),
    (ctx) => ctx.preCheckoutQuery.answer(true),
);

feature.on(
    "message:successful_payment",
    logHandle("donate-successful-payment"),
    async (ctx) => {
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
            ctx.logger.error({
                err: `Failed to store payment payload in database: ${String(error)}`,
                update: getUpdateInfo(ctx),
            });
        }
    },
);

export { composer as donateFeature };
