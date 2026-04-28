import { and, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { paymentsTable } from "../schema";

export const getPaymentByChargeIdQuery = db
    .select()
    .from(paymentsTable)
    .where(
        eq(paymentsTable.telegramPaymentChargeId, sql.placeholder("chargeId")),
    )
    .prepare("get_payment_by_charge_id");

export const insertPaymentQuery = db
    .insert(paymentsTable)
    .values({
        telegramPaymentChargeId: sql.placeholder("chargeId"),
        invoicePayload: sql.placeholder("invoicePayload"),
        userId: sql.placeholder("userId"),
        amount: sql.placeholder("amount"),
    })
    .onConflictDoNothing()
    .prepare("insert_payment");

export const claimPaymentForRefundQuery = db
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

export const releasePaymentRefundClaimQuery = db
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

export const markPaymentAsRefundedQuery = db
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
