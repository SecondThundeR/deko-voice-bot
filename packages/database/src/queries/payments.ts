import { and, eq } from "drizzle-orm";

import { db } from "../db.ts";
import { retryDatabaseOperation } from "../retry.ts";
import { paymentsTable, usersTable } from "../schema.ts";

type Payment = typeof paymentsTable.$inferSelect;
type ChargeId = Payment["telegramPaymentChargeId"];

interface InsertPaymentOptions {
    amount: Payment["amount"];
    chargeId: ChargeId;
    invoicePayload: Payment["invoicePayload"];
    userId: Payment["userId"];
}

export async function insertPayment(payment: InsertPaymentOptions) {
    await retryDatabaseOperation(() => insertPaymentOnce(payment));
}

async function insertPaymentOnce(payment: InsertPaymentOptions) {
    await db.transaction(async (tx) => {
        await tx
            .insert(usersTable)
            .values({ userId: payment.userId })
            .onConflictDoNothing();

        await tx
            .insert(paymentsTable)
            .values({
                telegramPaymentChargeId: payment.chargeId,
                invoicePayload: payment.invoicePayload,
                userId: payment.userId,
                amount: payment.amount,
            })
            .onConflictDoNothing();
    });
}

export async function getPaymentByChargeId(chargeId: ChargeId) {
    const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.telegramPaymentChargeId, chargeId));

    return payment ?? null;
}

export async function claimPaymentForRefund(chargeId: ChargeId) {
    const [payment] = await db
        .update(paymentsTable)
        .set({ status: "refund_pending", refundStartedAt: new Date() })
        .where(
            and(
                eq(paymentsTable.telegramPaymentChargeId, chargeId),
                eq(paymentsTable.status, "paid"),
            ),
        )
        .returning();

    return payment ?? null;
}

export async function releasePaymentRefundClaim(chargeId: ChargeId) {
    await retryDatabaseOperation(() =>
        db
            .update(paymentsTable)
            .set({ status: "paid", refundStartedAt: null })
            .where(
                and(
                    eq(paymentsTable.telegramPaymentChargeId, chargeId),
                    eq(paymentsTable.status, "refund_pending"),
                ),
            ),
    );
}

export async function markPaymentAsRefunded(chargeId: ChargeId) {
    return retryDatabaseOperation(() => markPaymentAsRefundedOnce(chargeId));
}

async function markPaymentAsRefundedOnce(chargeId: ChargeId) {
    const [payment] = await db
        .update(paymentsTable)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(
            and(
                eq(paymentsTable.telegramPaymentChargeId, chargeId),
                eq(paymentsTable.status, "refund_pending"),
            ),
        )
        .returning({
            telegramPaymentChargeId: paymentsTable.telegramPaymentChargeId,
        });

    if (payment) {
        return true;
    }

    const existingPayment = await getPaymentByChargeId(chargeId);

    return existingPayment?.status === "refunded";
}
