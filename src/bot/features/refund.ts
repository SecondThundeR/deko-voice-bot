import { Composer } from "grammy";
import {
    claimPaymentForRefund,
    getPaymentByChargeId,
    markPaymentAsRefunded,
    releasePaymentRefundClaim,
} from "#drizzle/queries/payments.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { escapeHTML } from "#root/bot/helpers/html.js";
import { logHandle } from "#root/bot/helpers/logging.js";
import { getSafeErrorInfo } from "#root/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("refund", logHandle("command-refund"), async (ctx) => {
    const chargeId = ctx.match.trim();
    if (!chargeId) {
        return ctx.reply(ctx.t("refund-id-required"));
    }

    try {
        const payment = await claimPaymentForRefund(chargeId);

        if (!payment) {
            const existingPayment = await getPaymentByChargeId(chargeId);

            if (!existingPayment) {
                return ctx.reply(ctx.t("refund-not-found"));
            }

            if (existingPayment.status === "refund_pending") {
                const transactions = await ctx.api.getStarTransactions({
                    limit: 100,
                });
                const confirmedByTelegram = JSON.stringify(
                    transactions,
                ).includes(existingPayment.telegramPaymentChargeId);
                if (confirmedByTelegram) {
                    await markPaymentAsRefunded(chargeId);
                    return ctx.reply(ctx.t("refund-already-completed"));
                }
                return ctx.reply(ctx.t("refund-in-progress"));
            }

            return ctx.reply(ctx.t("refund-already-completed"));
        }

        try {
            await ctx.api.refundStarPayment(
                payment.userId,
                payment.telegramPaymentChargeId,
            );
        } catch (error) {
            await releasePaymentRefundClaim(chargeId).catch((releaseError) => {
                ctx.logger.error({
                    msg: "Failed to release refund claim",
                    ...getSafeErrorInfo(releaseError),
                });
            });

            throw error;
        }

        const isPaymentMarkedAsRefunded = await markPaymentAsRefunded(chargeId);

        if (!isPaymentMarkedAsRefunded) {
            throw new Error("Failed to mark payment as refunded");
        }

        ctx.logger.info({ msg: "Refund completed" });

        await ctx.reply(
            ctx.t("refund-success", {
                amount: payment.amount,
                userId: payment.userId,
            }),
        );

        void ctx.api
            .sendMessage(
                payment.userId,
                ctx.t("refund-user-notice", { amount: payment.amount }),
            )
            .catch((err) => {
                ctx.logger.error({
                    msg: "Failed to send refund notice",
                    ...getSafeErrorInfo(err),
                });
            });
    } catch (error: unknown) {
        ctx.logger.error({
            msg: "Failed to make a refund",
            ...getSafeErrorInfo(error),
        });

        if (!error || typeof error !== "object") {
            return ctx.reply(
                ctx.t("refund-error", {
                    errorMessage: ctx.t("general-unknown-error"),
                }),
            );
        }

        const description =
            "description" in error && typeof error.description === "string"
                ? error.description
                : undefined;
        const message =
            "message" in error && typeof error.message === "string"
                ? error.message
                : undefined;

        return ctx.reply(
            ctx.t("refund-error", {
                errorMessage: escapeHTML(
                    description || message || ctx.t("general-unknown-error"),
                ),
            }),
        );
    }
});

export { composer as refundFeature };
