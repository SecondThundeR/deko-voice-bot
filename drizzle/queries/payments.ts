import { setTimeout as delay } from "node:timers/promises";

import { and, eq, sql } from "drizzle-orm";

import { db } from "../db.ts";
import { paymentsTable, usersTable } from "../schema.ts";

type Payment = typeof paymentsTable.$inferSelect;
type ChargeId = Payment["telegramPaymentChargeId"];

const RETRY_DELAYS_MS = [0, 100, 300] as const;

const getPaymentByChargeIdQuery = db
    .select()
    .from(paymentsTable)
    .where(
        eq(paymentsTable.telegramPaymentChargeId, sql.placeholder("chargeId")),
    )
    .prepare("get_payment_by_charge_id");

const claimPaymentForRefundQuery = db
    .update(paymentsTable)
    .set({ status: "refund_pending" })
    .where(
        and(
            eq(
                paymentsTable.telegramPaymentChargeId,
                sql.placeholder("chargeId"),
            ),
            eq(paymentsTable.status, "paid"),
        ),
    )
    .returning()
    .prepare("claim_payment_for_refund");

const releasePaymentRefundClaimQuery = db
    .update(paymentsTable)
    .set({ status: "paid" })
    .where(
        and(
            eq(
                paymentsTable.telegramPaymentChargeId,
                sql.placeholder("chargeId"),
            ),
            eq(paymentsTable.status, "refund_pending"),
        ),
    )
    .prepare("release_payment_refund_claim");

const markPaymentAsRefundedQuery = db
    .update(paymentsTable)
    .set({ status: "refunded" })
    .where(
        and(
            eq(
                paymentsTable.telegramPaymentChargeId,
                sql.placeholder("chargeId"),
            ),
            eq(paymentsTable.status, "refund_pending"),
        ),
    )
    .returning({
        telegramPaymentChargeId: paymentsTable.telegramPaymentChargeId,
    })
    .prepare("mark_payment_as_refunded");

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
            if (attempt === RETRY_DELAYS_MS.length - 1) {
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
    const [payment] = await getPaymentByChargeIdQuery.execute({ chargeId });

    return payment ?? null;
}

export async function claimPaymentForRefund(chargeId: ChargeId) {
    const [payment] = await claimPaymentForRefundQuery.execute({ chargeId });

    return payment ?? null;
}

export async function releasePaymentRefundClaim(chargeId: ChargeId) {
    await retryPaymentWrite(() =>
        releasePaymentRefundClaimQuery.execute({ chargeId }),
    );
}

export async function markPaymentAsRefunded(chargeId: ChargeId) {
    return retryPaymentWrite(() => markPaymentAsRefundedOnce(chargeId));
}

async function markPaymentAsRefundedOnce(chargeId: ChargeId) {
    const [payment] = await markPaymentAsRefundedQuery.execute({ chargeId });

    if (payment) {
        return true;
    }

    const existingPayment = await getPaymentByChargeId(chargeId);

    return existingPayment?.status === "refunded";
}
