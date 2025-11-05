import { eq, sql } from "drizzle-orm";

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
    .prepare("insert_payment");

export const markPaymentAsRefundedQuery = db
    .update(paymentsTable)
    .set({ status: "refunded" })
    .where(
        eq(paymentsTable.telegramPaymentChargeId, sql.placeholder("chargeId")),
    )
    .prepare("mark_payment_as_refunded");
