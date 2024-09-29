import { count, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { voicesTable } from "../schema";

export const getAllVoicesQuery = db
    .select()
    .from(voicesTable)
    .prepare("get_all_voices");

export const getVoicesBasicStatsQuery = db
    .select({
        usesAmount: voicesTable.usesAmount,
    })
    .from(voicesTable)
    .prepare("get_voices_basic_stats");

export const getVoicesFullStatsQuery = db
    .select({
        voiceTitle: voicesTable.voiceTitle,
        usesAmount: voicesTable.usesAmount,
    })
    .from(voicesTable)
    .prepare("get_voices_full_stats");

export const getVoiceByUniqueIdQuery = db
    .select()
    .from(voicesTable)
    .where(eq(voicesTable.fileUniqueId, sql.placeholder("fileUniqueId")))
    .prepare("get_voice_by_unique_id");

export const getVoicesCountByIdQuery = db
    .select({ count: count() })
    .from(voicesTable)
    .where(eq(voicesTable.voiceId, sql.placeholder("voiceId")))
    .prepare("get_voices_count_by_id");

export const incrementVoiceUsesAmountQuery = db
    .update(voicesTable)
    .set({
        usesAmount: sql`${voicesTable.usesAmount} + 1`,
    })
    .where(eq(voicesTable.voiceId, sql.placeholder("voiceId")))
    .prepare("increment_voice_use_amount");

export const deleteVoiceByIdQuery = db
    .delete(voicesTable)
    .where(eq(voicesTable.voiceId, sql.placeholder("voiceId")))
    .returning({ voiceId: voicesTable.voiceId })
    .prepare("delete_voice_by_id");
