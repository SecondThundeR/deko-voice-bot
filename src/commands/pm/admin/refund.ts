import { eq } from "drizzle-orm";
import { Composer } from "grammy";

import { db } from "@/drizzle/db";
import { paymentsTable } from "@/drizzle/schema";

import type { BotContext } from "@/src/types/bot";

export const refundCommand = new Composer<BotContext>();

refundCommand.command("refund", async (ctx) => {
    const chargeId = ctx.match;
    if (!chargeId) {
        return ctx.reply(ctx.t("refund.emptyId"));
    }

    try {
        const payments = await db
            .select()
            .from(paymentsTable)
            .where(eq(paymentsTable.telegramPaymentChargeId, chargeId));

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

        await db
            .update(paymentsTable)
            .set({ status: "refunded" })
            .where(eq(paymentsTable.telegramPaymentChargeId, chargeId));

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
        console.error("Failed to make a refund", error);

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
