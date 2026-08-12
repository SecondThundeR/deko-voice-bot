import { setTimeout as delay } from "node:timers/promises";

import { and, eq } from "drizzle-orm";

import { db } from "../db.ts";
import { paymentsTable, usersTable } from "../schema.ts";

type Payment = typeof paymentsTable.$inferSelect;
type ChargeId = Payment["telegramPaymentChargeId"];

const RETRY_DELAYS_MS = [0, 100, 300] as const;
const TRANSIENT_SQLSTATES = new Set([
    "40001",
    "40P01",
    "55P03",
    "57014",
    "08000",
    "08003",
    "08006",
]);

function isTransientDatabaseError(error: unknown) {
    return (
        !!error &&
        typeof error === "object" &&
        "code" in error &&
        typeof error.code === "string" &&
        TRANSIENT_SQLSTATES.has(error.code)
    );
}

interface InsertPaymentOptions {
    amount: Payment["amount"];
    chargeId: ChargeId;
    invoicePayload: Payment["invoicePayload"];
    userId: Payment["userId"];
}

export async function insertPayment(payment: InsertPaymentOptions) {
    await retryPaymentWrite(() => insertPaymentOnce(payment));
}

async function retryPaymentWrite<T>(operation: () => Promise<T>) {
    for (const [attempt, retryDelayMs] of RETRY_DELAYS_MS.entries()) {
        if (retryDelayMs > 0) {
            await delay(retryDelayMs);
        }

        try {
            return await operation();
        } catch (error) {
            if (
                attempt === RETRY_DELAYS_MS.length - 1 ||
                !isTransientDatabaseError(error)
            ) {
                throw error;
            }
        }
    }

    throw new Error("Payment database retry loop exhausted unexpectedly");
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
    await retryPaymentWrite(() =>
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
    return retryPaymentWrite(() => markPaymentAsRefundedOnce(chargeId));
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
