import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertVoice,
    type SelectVoiceSubmission,
    usersTable,
    voiceSubmissionsTable,
    voicesTable,
} from "../schema.ts";

type AdminSubmissionBucket = "queue" | "history";

export async function createVoiceSubmission(input: {
    id: string;
    submitterUserId: number;
    title: string;
    requestedTrimStartMs: number;
    requestedTrimEndMs: number | null;
}) {
    return db.transaction(async (tx) => {
        await tx.execute(
            sql`select pg_advisory_xact_lock(${input.submitterUserId}::bigint)`,
        );
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1_000);
        const [quota] = await tx
            .select({
                recent: sql<number>`cast(count(*) filter (where ${and(
                    gt(voiceSubmissionsTable.createdAt, oneDayAgo),
                    ne(voiceSubmissionsTable.status, "failed"),
                )}) as int)`,
                unresolved: sql<number>`cast(count(*) filter (where ${inArray(
                    voiceSubmissionsTable.status,
                    ["uploading", "pending", "processing"],
                )}) as int)`,
            })
            .from(voiceSubmissionsTable)
            .where(
                eq(
                    voiceSubmissionsTable.submitterUserId,
                    input.submitterUserId,
                ),
            );
        if ((quota?.recent ?? 0) >= 3 || (quota?.unresolved ?? 0) >= 3) {
            return null;
        }
        const [submission] = await tx
            .insert(voiceSubmissionsTable)
            .values(input)
            .returning();
        return submission ?? null;
    });
}

export async function markVoiceSubmissionPending(
    id: string,
    source: {
        sourceChatId: number;
        sourceFileId: string;
        sourceFileUniqueId: string;
        sourceMessageId: number;
    },
) {
    const [submission] = await db
        .update(voiceSubmissionsTable)
        .set({ ...source, status: "pending", updatedAt: new Date() })
        .where(
            and(
                eq(voiceSubmissionsTable.id, id),
                eq(voiceSubmissionsTable.status, "uploading"),
            ),
        )
        .returning();
    return submission ?? null;
}

export async function markVoiceSubmissionFailed(id: string) {
    await db
        .update(voiceSubmissionsTable)
        .set({
            status: "failed",
            finalizedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(voiceSubmissionsTable.id, id));
}

export async function getVoiceSubmission(id: string) {
    const [submission] = await db
        .select()
        .from(voiceSubmissionsTable)
        .where(eq(voiceSubmissionsTable.id, id))
        .limit(1);
    return submission ?? null;
}

export async function getUserVoiceSubmissions(userId: number) {
    return db
        .select()
        .from(voiceSubmissionsTable)
        .where(eq(voiceSubmissionsTable.submitterUserId, userId))
        .orderBy(desc(voiceSubmissionsTable.createdAt));
}

export async function getAdminVoiceSubmissions(input: {
    bucket: AdminSubmissionBucket;
    limit: number;
    offset: number;
}) {
    const statuses =
        input.bucket === "queue"
            ? (["uploading", "pending", "processing", "failed"] as const)
            : (["approved", "rejected"] as const);
    return db
        .select({
            submission: voiceSubmissionsTable,
            submitter: {
                id: usersTable.userId,
                fullname: usersTable.fullname,
                username: usersTable.username,
            },
        })
        .from(voiceSubmissionsTable)
        .innerJoin(
            usersTable,
            eq(usersTable.userId, voiceSubmissionsTable.submitterUserId),
        )
        .where(inArray(voiceSubmissionsTable.status, statuses))
        .orderBy(
            input.bucket === "queue"
                ? asc(voiceSubmissionsTable.createdAt)
                : desc(voiceSubmissionsTable.finalizedAt),
        )
        .limit(input.limit)
        .offset(input.offset);
}

export async function updateVoiceSubmissionTitle(id: string, title: string) {
    const [submission] = await db
        .update(voiceSubmissionsTable)
        .set({ title, updatedAt: new Date() })
        .where(
            and(
                eq(voiceSubmissionsTable.id, id),
                inArray(voiceSubmissionsTable.status, ["pending", "failed"]),
            ),
        )
        .returning();
    return submission ?? null;
}

export async function claimVoiceSubmission(
    id: string,
    moderatorUserId: number,
    title?: string,
) {
    const [submission] = await db
        .update(voiceSubmissionsTable)
        .set({
            status: "processing",
            moderatorUserId,
            ...(title === undefined ? {} : { title }),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(voiceSubmissionsTable.id, id),
                inArray(voiceSubmissionsTable.status, ["pending", "failed"]),
            ),
        )
        .returning();
    return submission ?? null;
}

export async function releaseVoiceSubmission(id: string) {
    await db
        .update(voiceSubmissionsTable)
        .set({
            status: "failed",
            finalizedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(voiceSubmissionsTable.id, id),
                eq(voiceSubmissionsTable.status, "processing"),
            ),
        );
}

export async function rejectVoiceSubmission(
    id: string,
    moderatorUserId: number,
    rejectionReason?: string,
) {
    const [submission] = await db
        .update(voiceSubmissionsTable)
        .set({
            status: "rejected",
            moderatorUserId,
            rejectionReason: rejectionReason || null,
            finalizedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(voiceSubmissionsTable.id, id),
                inArray(voiceSubmissionsTable.status, ["pending", "failed"]),
            ),
        )
        .returning();
    return submission ?? null;
}

export async function approveVoiceSubmission(
    id: string,
    voice: Omit<InsertVoice, "usesAmount">,
) {
    return db.transaction(async (tx) => {
        const [inserted] = await tx
            .insert(voicesTable)
            .values(voice)
            .onConflictDoNothing()
            .returning({ voiceId: voicesTable.voiceId });
        if (!inserted) return null;

        const [submission] = await tx
            .update(voiceSubmissionsTable)
            .set({
                approvedVoiceId: inserted.voiceId,
                status: "approved",
                finalizedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(voiceSubmissionsTable.id, id),
                    eq(voiceSubmissionsTable.status, "processing"),
                ),
            )
            .returning();
        if (!submission) throw new Error("Submission is no longer processing");
        return submission;
    });
}

export async function deleteExpiredVoiceSubmissions(retentionDays: number) {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1_000);
    return db
        .delete(voiceSubmissionsTable)
        .where(
            and(
                lt(voiceSubmissionsTable.finalizedAt, cutoff),
                inArray(voiceSubmissionsTable.status, [
                    "approved",
                    "rejected",
                    "failed",
                ]),
            ),
        )
        .returning({ id: voiceSubmissionsTable.id });
}

export function toSubmissionDto(submission: SelectVoiceSubmission) {
    return {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        rejectionReason: submission.rejectionReason,
        approvedVoiceId: submission.approvedVoiceId,
        requestedTrim: {
            startMs: submission.requestedTrimStartMs,
            endMs: submission.requestedTrimEndMs,
        },
        createdAt: submission.createdAt.toISOString(),
        finalizedAt: submission.finalizedAt?.toISOString() ?? null,
    };
}

export function toAdminSubmissionDto(
    row: Awaited<ReturnType<typeof getAdminVoiceSubmissions>>[number],
) {
    return {
        ...toSubmissionDto(row.submission),
        moderatorUserId: row.submission.moderatorUserId,
        submitter: row.submitter,
    };
}
