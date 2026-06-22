import { Composer } from "grammy";
import {
    claimPaymentForRefundQuery,
    getPaymentByChargeIdQuery,
    markPaymentAsRefundedQuery,
    releasePaymentRefundClaimQuery,
} from "#drizzle/prepared/payments.js";
import type { Context } from "#root/bot/context.js";
import { isAdmin } from "#root/bot/filter/is-admin.js";
import { getUpdateInfo, logHandle } from "#root/bot/helpers/logging.js";

const composer = new Composer<Context>();

const feature = composer.chatType("private").filter(isAdmin);

feature.command("refund", logHandle("command-refund"), async (ctx) => {
    const chargeId = ctx.match.trim();
    if (!chargeId) {
        return ctx.reply(ctx.t("refund.emptyId"));
    }

    try {
        const [payment] = await claimPaymentForRefundQuery.execute({
            chargeId,
        });

        if (!payment) {
            const [existingPayment] = await getPaymentByChargeIdQuery.execute({
                chargeId,
            });

            if (!existingPayment) {
                return ctx.reply(ctx.t("refund.notFound"));
            }

            if (existingPayment.status === "refund_pending") {
                return ctx.reply(ctx.t("refund.inProgress"));
            }

            return ctx.reply(ctx.t("refund.alreadyRefunded"));
        }

        try {
            await ctx.api.refundStarPayment(
                payment.userId,
                payment.telegramPaymentChargeId,
            );
        } catch (error) {
            await releasePaymentRefundClaimQuery
                .execute({ chargeId })
                .catch((releaseError) => {
                    ctx.logger.error({
                        err: `Failed to release refund claim: ${String(releaseError)}`,
                        update: getUpdateInfo(ctx),
                    });
                });

            throw error;
        }

        const [refundedPayment] = await markPaymentAsRefundedQuery.execute({
            chargeId,
        });

        if (!refundedPayment) {
            throw new Error("Failed to mark payment as refunded");
        }

        await ctx.reply(
            ctx.t("refund.success", {
                amount: payment.amount,
                userId: String(payment.userId),
            }),
        );

        ctx.api
            .sendMessage(
                payment.userId,
                ctx.t("refund.userNotice", { amount: String(payment.amount) }),
            )
            .catch((err) => {
                ctx.logger.error({
                    msg: `Failed to send refund notice to user ${payment.userId}`,
                    err,
                });
            });
    } catch (error: unknown) {
        ctx.logger.error({
            err: `Failed to make a refund: ${String(error)}`,
            update: getUpdateInfo(ctx),
        });

        if (!error || typeof error !== "object") {
            return ctx.reply(
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

        return ctx.reply(
            ctx.t("refund.error", {
                message:
                    description || message || ctx.t("general.unknownError"),
            }),
        );
    }
});

export { composer as refundFeature };
