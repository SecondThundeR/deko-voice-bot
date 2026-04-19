import { Composer } from "grammy";
import {
    getPaymentByChargeIdQuery,
    markPaymentAsRefundedQuery,
} from "@/drizzle/prepared/payments";
import type { Context } from "../context";
import { isAdmin } from "../filter/is-admin";
import { getUpdateInfo, logHandle } from "../helpers/logging";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("refund", logHandle("command-refund"), async (ctx) => {
    const chargeId = ctx.match;
    if (!chargeId) {
        return ctx.reply(ctx.t("refund.emptyId"));
    }

    try {
        const payments = await getPaymentByChargeIdQuery.execute({ chargeId });

        if (payments.length === 0) {
            return ctx.reply(ctx.t("refund.notFound"));
        }

        const payment = payments[0];

        if (payment.status === "refunded") {
            return ctx.reply(ctx.t("refund.alreadyRefunded"));
        }

        await ctx.api.refundStarPayment(
            payment.userId,
            payment.telegramPaymentChargeId,
        );

        await markPaymentAsRefundedQuery.execute({ chargeId });

        await ctx.reply(
            ctx.t("refund.success", {
                amount: payment.amount,
                userId: String(payment.userId),
            }),
        );

        await ctx.api.sendMessage(
            payment.userId,
            ctx.t("refund.userNotice", { amount: String(payment.amount) }),
        );
    } catch (error: unknown) {
        ctx.logger.error({
            err: `Failed to make a refund: ${String(error)}`,
            update: getUpdateInfo(ctx),
        });

        if (!error || typeof error !== "object") {
            return await ctx.reply(
                ctx.t("refund.error", {
                    message: ctx.t("general.unknownError"),
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

        await ctx.reply(
            ctx.t("refund.error", {
                message:
                    description || message || ctx.t("general.unknownError"),
            }),
        );
    }
});

export { composer as refundFeature };
